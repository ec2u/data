---
title: Events › Pipes
summary: Requirements for source ingestion
description: Requirements for source ingestion, one pipe per source, committed entry by entry or whole as the class asks
status: draft
---

Requirements for source ingestion: one pipe per source, committed entry by entry where partial states are legitimate and
whole where they are not.

# Sources

Two classes, told apart by the consistency each demands. The class settles the unit of commit, what an interrupted run
leaves behind, and what a refused retraction costs.

- **Atomic** — delivered whole in a single document, a SKOS taxonomy in a CSV among them. Mixed states are not
  tolerable: the unit of consistency is the whole artefact, so a run either replaces it or leaves it as it was. Removal
  is unrecoverable here, as removing a resource clears references to it from every other resource and re-inserting it
  does not bring them back.

- **Incremental** — crawled entry by entry across runs: events, courses. Partial states are legitimate: the unit of
  consistency is the entry, and the target is eventual consistency. A run cut short by a fetch failure, a crash or a
  cancellation leaves the store usable, and the next run carries on without repeating what was already committed.

Both classes run the same pipe and part only at the sink. What decides the class in practice is whether the whole feed
fits inside one transaction, and that is settled by whether drawing it means fetching: a taxonomy parses in seconds, a
catalogue of events is minutes of retrievals and extractions. Intolerance of mixed states is what makes a transaction
desirable; not fetching is what makes it affordable.

# Requirements

- **Frugal** — each run does only the work the store hasn't already got.
- **Restartable** — a run always tries to complete, but one aborted or failed part way leaves the store consistent and
  the next run carries on from what was committed, never from scratch.
- **Graceful under mishaps** — fetch failures and remote service failures are absorbed, not fatal, and never interpreted
  as absence: an unreachable source yields no scan, and no scan yields no retraction.
- **Scheduled** — run by the GCP scheduler, each workflow on an endpoint of its own.
- **Bounded in practice** — once the store is primed a run has only the day's changes to draw, and takes a couple of
  minutes to do it.

# The pipe

One workflow per source, scheduled on its own. A run **scans** what the source lists and hands it to two branches
drawing the same feed: **insert** states what each entry is, **remove** watches the whole scan go by and, once it is
over, retracts what the store holds and the scan never named. Both state their conclusions as deltas and close on one
sink, which commits them as the class demands.

```text
      ┌─ insert ─ read, convert, judge ────────── deltas, as they are drawn ─┐
scan ─┤                                                                      ├─ persist
      └─ remove ─ collect, wait for the end, weigh ─── deltas, all at once ──┘
```

Absence from a complete scan is proof of deletion, and the split is what that premise costs: a retraction rests on the
scan as a whole rather than on any entry in it, so none may be stated until the scan is over, and a scan that comes back
implausibly short states none at all.

| Question              | Branch   | Test                                                   |
|-----------------------|----------|--------------------------------------------------------|
| Which pages to read?  | `insert` | never read, or a marker moved past the stored copy     |
| What no longer holds? | `remove` | stale by its own state, or absent from a complete scan |

## Invariants

- **One item at a time** — every entry is read, judged and stated on its own, so a mishap costs the judgement of one
  entry rather than the run's. Whether it is also *committed* on its own is the class's to settle, and concurrency is a
  separate axis, settled inside `insert`.

- **One staleness predicate per kind** — a single test judges an entry from its own state, and both branches apply it:
  `insert` to what it has just extracted, `remove` to what the store holds. What the test reads is the kind's business
  and nobody else's: an event by its dates, a course by the end of its delivery. A kind with no such test rests on what
  its pages answer, and pays for it in how often they must be read.

- **One identity function per source** — an entry is named from what the scan listed, by a single helper both branches
  call: `insert` to name what it stores, `remove` to name what it retracts. The store holds whatever `insert` wrote, so
  centralising the rule is what keeps the two in agreement without conferring. Whatever a retrieved page says about its
  own address is data, never identity: derived from what came back rather than from what was asked for, the branches
  would disagree and an entry would be retracted and re-created under a new name every run.

- **Removal takes evidence** — an entry goes on a positive fact: its own state condemning it, or a scan that named
  everything else and not it. The first is a fact about the entry and stands on its own; the second is a fact about the
  run, and is worth exactly as much as the scan behind it.

- **Overlap wastes, it does not corrupt** — an attempt still running when the scheduler retries draws the same work
  twice and nothing worse: upserts are idempotent and every removal is evidenced afresh. No lease to refresh, and none
  to expire at the wrong moment.

## Scan

Read what the source lists, together with whatever marker it carries for each entry: a `modified` date, an entity tag, a
digest of the row.

- **Repeated, not recorded** — seconds against a run measured in minutes, so rescanning from scratch buys away the
  cursor, the checkpoint and the stored census alike, and leaves no progress to corrupt. That is how every source in
  hand is drawn, and what one too costly to crawl whole would have to give up.

- **A feed of entries, however it is built** — the scan hands the branches a feed and nothing else, and neither asks
  where it came from. A catalogue that outgrew crawling whole would harvest across runs into a census in the store and
  hand over a feed only once that census closed, leaving both branches as they are. Two conditions would make it safe.
  The census is generational, opened fresh each cycle and replacing the last on closing, or absence from one merely
  topped up stops meaning anything, as a modified-since pass reports additions and never deletions. And it closes on the
  source's own evidence that nothing is left, a cursor that terminated or a count that matches, as a harvest that simply
  stopped and called itself whole retracts every page it missed. A run whose harvest has not closed yields no scan at
  all, which is not the same as a scan that closed on an empty listing.

- **Discovery and adjudication both** — the scan settles which entries are worth reading and, taken whole, which ones no
  longer exist. A page that fails to arrive is therefore no longer merely a turn postponed: it is a hole in the only
  evidence a retraction has.

- **A broken index is the one real hazard** — a backend answering empty or short, an auth wall served as `200`, a filter
  silently applied: each is a coherent scan of a catalogue that isn't there, and nothing downstream can tell one from a
  genuine mass withdrawal. The floor in `remove` is what stands between it and the store.

- **For an atomic source the scan is the document** — index and entries arrive together, so the scan and the reading
  coincide and completeness is a property of one parse rather than of a page count. A digest of the document, not of its
  rows, settles whether the run happens at all: an unchanged artefact means no run, exactly rather than approximately.

## Insert

Read what the scan calls for: entries the store never read, and entries whose marker has moved past the stored copy. For
an atomic source there is nothing left to read, and the branch only converts and judges what the scan already handed it.

- **Everything scanned, minus what the store already has** — the marker or digest skip lives inside the branch, so what
  `remove` sees stays the scan entire. Placed upstream of the split it would hand `remove` only the entries that
  changed, and the first quiet day would retract the catalogue.

- **The branch sets the pace** — the two draw in lockstep and neither runs ahead of the feed, so the run advances at the
  speed of the reads. What sets that speed is the branch's own window, several pages in flight at once, and
  `remove` keeps up on the cost of a set insertion.

- **The retrieval settles nothing about delisting** — a fetch drops an unsuccessful response the way it drops nothing at
  all, so a page answering that it is gone reaches the branch as silence, indistinguishable from one that timed out.
  Nothing here retires an entry the index still lists, and delisting rests on the scan alone. Telling the two apart
  would take a retrieval reporting its own outcome, which nothing else in the branch has any use for.

- **Only a successful write advances the evidence for skipping** — the state and the digest justifying it are recorded
  together, so a read that dies leaves its entry to be read again, and re-reading an entry already current costs a
  comparison and no write. The digest is held per source page, which makes the skip a property of the page rather than
  of the entry drawn from it.

- **A source marker beats a digest** — where the index carries one, keep it as the source reports it and read on the
  marker moving past its stored copy. That skips the retrieval outright, where a digest still pays for it.

- **Never compare a source stamp with one of ours** — different clocks, often different precision. A source value is
  compared only against the stored copy of itself, ours only against each other, all taken from the run's start.

## Remove

Draw what the store holds for the source, watch the scan go by, and retract at the end what the entries' own state
condemns or the scan never named.

- **It watches the scan, not the harvest** — the branch sits beside `insert` rather than after it, so it sees every
  entry the source listed rather than only the ones worth reading. Naming each one as it goes puts identifiers on both
  sides of the final comparison, and the store is never asked what a page is called.

- **Silent until the scan is over** — nothing follows from a partial scan, so the branch states nothing while the feed
  runs and everything once it is dry. Retirements land after the last insertion as a consequence rather than by
  arrangement, and no retraction can race the upsert of its own entry: what the scan named is never what the branch
  retracts.

- **A floor under the retraction** — a run retracting more than some fraction of what the store holds for the source
  states nothing and fails, so a broken index costs a run instead of the catalogue. A scan that completed and named
  nothing is no special case: it is the largest retraction there is, and it meets the floor like any other. Only an
  operator lifts it, for one run, having established that the withdrawal is real. It guards both classes alike, and it
  is the reason either may treat absence as evidence at all.

- **Expiry needs no scan** — sources list past entries as a matter of course, so the bulk of the retiring is drawn from
  the store's own copy against the staleness predicate. That half is evidenced entry by entry, is judged on every
  attempt including one whose scan came back empty, and the floor does not apply to it.

- **Queries narrow, they don't decide** — the entries of a source come from a targeted store query, but the predicate
  stays the authority. The query may over-select freely and must never under-select, or a class of entries becomes
  immortal.

- **Nothing sweeps across sources** — every removal is drawn for the source that claims the entry. Entries left behind
  by a source no longer configured at all belong to a maintenance pass, not to a scheduled run.

- **A census in memory, for the length of a run** — the branch holds the scanned identifiers until the feed runs dry,
  which is the census the scan is spared from storing. A few thousand strings for a couple of minutes, against a table
  that would have to be kept true.

## Commit

Both branches close on one sink, and how that sink commits is the only place the classes part.

- **An entry at a time, for an incremental source** — store operations are already indivisible and an entry is one
  operation, so every delta stands alone. A failed write is logged and counted, leaving the entry as it was and the feed
  running: one unusable entry, or one hostile response from the store, costs an entry rather than the run.

- **One transaction, for an atomic source** — the whole feed is drawn inside a single store transaction, additions and
  removals committing together or not at all, so no state exists in which the artefact is half replaced. Nothing is
  absorbed while it does: the first failing write ends the run and leaves the store exactly as it was.

- **The transaction subsumes the complete read** — an artefact had to be read whole before anything was written, because
  a truncated transfer or an error page served as `200` would otherwise half-replace the scheme. Under one transaction a
  parse dying mid-feed rolls the run back untouched, so materialising the document first is a choice about memory rather
  than a rule about safety.

- **It also makes the refusal total** — `remove` refusing a wholesale retraction throws once the scan is over, and under
  a transaction that takes the insertions down with it. An incremental run refusing the same retraction keeps the
  insertions it already committed, which is right there and would be wrong here.

- **Progress lives in the entries, or nowhere** — an incremental run is restartable because every commit is a restart
  point: it re-scans, finds the committed entries current, and picks up the rest, with nothing held back to a final step
  and nothing to reconcile before the next run begins. An atomic run has no partial progress to resume and simply starts
  over, which it can afford, as it fetches nothing and finishes in seconds.

- **A rejected state ends either run** — a hostile response costs the entry it concerns, but a state the shape refuses
  condemns every write alike and would hand back a clean run that stored nothing. That failure is propagated rather than
  counted, so the scheduler sees the attempt fail and retries it.
