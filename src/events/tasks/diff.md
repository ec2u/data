---
title: Incremental Sync Constraints
summary: Soundness constraints on the coimbra crawl reap
description: Rules a run must respect before it retracts a stored entry.
---

# Absence Is Not Deletion

The reap reads *entry not confirmed by this run* as *entry no longer exists at the source*. The two are only
equivalent if the run can tell a source removal from an observation failure. It cannot: both leave the entry sitting
in `entries` when the crawl drains.

## Ways a live entry goes unconfirmed

- `fetch()` throws or returns an error page
- `extract()` yields nothing (parse or model failure)
- `validate()` rejects the converted event
- the digest filter skips the page
- `take(1)` truncates the crawl to one listing page
- `pagination.total_pages` comes back short

A schema tightening that rejects 30% of events deletes 30% of the store on the next run. Truncating the input
truncates the store.

## Constraint

Confirmation is a fact about fetching an entry, not about producing a delta for it. Record it near the top of the
pipeline, independently of what happens downstream. An entry fetched but not extracted is present with unknown state,
which is a hold, not a retraction.

Retraction needs a second gate: emit none unless the crawl is provably complete (no fetch failures, no truncation, no
pagination anomaly). Add a plausibility bound, since a large retraction batch is far more likely to be a broken run
than an emptied source.

# A Skip Is Presence

The digest filter and the reap point at the same entries in opposite directions, and the reap wins. An unchanged page
is dropped before it can produce a delta, its entry is never confirmed, and it is retracted.

The damage compounds. Run *n* skips the unchanged page and deletes the entry. Run *n+1* finds the digest still stored,
skips again, and deletes an entry that is already gone. The event never returns, because the only path that
re-inserts it is the extract branch the skip is bypassing. The store converges on empty for exactly the entries most
stable at the source.

## Constraint

The two signals answer different questions. The digest answers *has the state changed*, and its "no" is a positive
observation that confirms the entry. The reap answers *was the entry seen at all*.

So the digest cannot be a filter inside the delta pipeline. It is a branch, and both arms confirm: on a match, confirm
and emit nothing; on a miss, confirm and continue to extraction. Only an entry that never reached the comparison is a
reap candidate.

# The Entry Must Be Remembered, Not Derived

Three key spaces are in play, with no mapping between them: the crawl produces `${Events}/${key}` URLs, `entries`
holds store references, and the delta key is `event.id`, which `convert` builds as a UUIDv3 of the `url` property the
**extraction** pulled out of the page.

So the value that confirms a stored entry is a hash of model output. Any drift in that extracted URL (trailing slash,
added query string, a canonical link pointing elsewhere, a locale prefix) yields a different UUID: the run inserts a
new entry, leaves the old one unconfirmed, and reaps it. The event changes identity and anything referencing the old
id breaks. `entries.delete(entry)` returns a boolean nobody reads, so a miss looks exactly like a hit.

The circularity is the real blocker. Confirmation must happen before extraction, but the entry is only known after it.
An unchanged page cannot be both skipped and confirmed while the entry is derived rather than remembered.

## Constraint

Persist the association. A page record keyed by the crawl URL holds the digest, the entry that page last produced, and
when it was retrieved. Fetching a URL then yields its entry at once: a digest match confirms and stops, a mismatch
goes on to extraction, and a page recorded as stating no event is known without re-running the model.

The record has to tolerate the real cardinality: an event carries `multiple` URLs, so several crawl URLs may confirm
one entry, and a page stating no event maps to none.

# The Transaction Is Not Free, The Deletion Is Not Reversible

`sync` is atomic: `store.execute(client => feed(each(…)))` drains the whole delta feed inside one transaction, so
inserts and retractions commit together or not at all. There is no half-reaped state.

The cost is that the feed is lazy, so every fetch, every `focus`/`untag`, and every model call in `extract` runs
*inside* `execute`. The transaction lasts as long as the crawl: minutes to hours, bounded by an external site and an
LLM. A mock store hides this; a real connector will impose a far shorter window and fail as a timeout at the end of a
full run, after all the extraction has been paid for.

`remove` compounds it. Its contract clears references to the resource from other resources and cascade-removes captive
ones, so a wrong retraction strips inbound references elsewhere in the store, and re-inserting the event later does not
bring them back. Retraction is triggered by an unreliable signal and is irreversible.

## Constraints

- Crawl outside `execute`. Apply the deltas in batches once the crawl is done, or accept a transaction as long as the
  site and the model take.
- Retract with a marker and collect it later, after some number of consecutive runs agree. Same visible outcome, and a
  reap driven by a bad run stays recoverable.

# The Listing Is A Window, Not A Census

The crawl enumerates an agenda search, which returns what is upcoming rather than everything ever published. Every
event then drops out of the listing the day it happens and is reaped on the next run. The store never accumulates a
past: it holds a rolling window of the future, and the deletions look like ordinary churn, so nothing signals that
history is going away.

Retention has to be decided, not inherited from the source's paging:

- **Past events kept.** Absence from the listing must never retract, since the listing was never a census of the
  store. `isStale` then becomes the only bound on growth, which is a different job than the one it is placed to do.
- **Past events dropped.** The reap is doing it by accident, at whatever moment the source's window happens to move,
  and `isStale` is redundant with it.

## Constraint

Retract on positive evidence that the source withdrew the event: a `404` or `410` on the event page. It is cheap, and
it survives the failure modes above, since a fetch that errors is not a `404` and a URL the run never reached produces
nothing to misread. Absence from a listing is the weakest signal available, and it is the one the sketch acts on.

# Staleness Belongs To The Store, Not To The Crawl

`isStale` runs on freshly extracted events inside the crawl, so it only ever sees an event on the path the digest skip
is designed to avoid.

An event stored while fresh becomes stale a week later without a byte of its page changing. The digest matches, the
page is skipped, `isStale` never sees it again, and where the listing keeps past events the entry is confirmed on
every run and stays forever.

The inverse costs money. A stale page produces no insert, so it commits no digest, so every run re-fetches and
re-extracts it to re-derive a verdict already known. The stale set only grows.

## Constraint

A time-dependent predicate does not belong in a content-triggered pipeline. Staleness is a property of stored state
and elapsed time: sweep the store for entries in scope whose `endDate`, or `startDate` in its absence, has passed, and
retract them there.

The crawl then decides only what the source says and the sweep only what time has done, which also separates the two
retraction causes the sketch currently runs together.
