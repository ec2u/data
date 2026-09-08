---
title: Events › Pipes
summary: Requirements for source ingestion
description: Requirements for source ingestion, incremental where it can be and atomic where it must be.
status: draft
---

Requirements for source ingestion that is incremental where it can be and atomic where it must be.

# Sources

Two classes, told apart by the consistency each demands. The class settles the unit of commit, what counts as evidence
for a removal, and how an interrupted run resumes.

- **Atomic** — delivered whole in a single document, a SKOS taxonomy in a CSV among them. Mixed states are not
  tolerable: the unit of consistency is the whole artefact, so a run either replaces it or leaves it as it was. A
  complete read makes absence evidence, and removals are drawn in the same pass.

- **Incremental** — crawled entry by entry across runs: events, courses. Partial states are legitimate: the unit of
  consistency is the entry, and the target is eventual consistency. A run cut short by a deadline, a fetch failure or a
  crash leaves the store usable, and the next run carries on without repeating what was already committed. Absence
  alone is never evidence.

# Requirements

- **Frugal** — each run does only the work the store hasn't already got.
- **Graceful under deadlines** — a run cut short leaves the store consistent; the next run carries on.
- **Graceful under mishaps** — fetch failures and remote service failures are absorbed, not fatal, and never interpreted
  as absence: an unreachable source is not a retraction.
- **Scheduled** — run by the GCP scheduler, each workflow on an endpoint of its own.
- **Budget** — a couple of minutes per run once the store is primed.

# Atomic sources

Open. A scheme fits one transaction, and removal is unrecoverable, as removing a resource clears references to it from
every other resource and re-inserting it does not bring them back. Reaping belongs in the same pass as the upserts,
guarded by:

- **A complete read before any write** — status, content type and a parse reaching EOF. A truncated transfer or an error
  page served as `200` aborts with nothing written. Materialising first is right here, and a taxonomy affords it.

- **A digest of the document, not of its rows** — an unchanged artefact means no run at all, exactly rather than
  approximately.

- **A floor under the retraction** — a complete read may still be the wrong document. A run retracting more than some
  fraction of the scheme is refused, overridably, so a bad export fails the job instead of emptying the store.

- **One transaction over the whole update** — additions and removals commit together or not at all, leaving no state in
  which the scheme is half replaced. The sink both classes close on takes this as an option, drawing the whole feed
  inside one store transaction and absorbing no failure while it does.

# Incremental sources

One workflow per source, scheduled on its own. A run **scans** the source's index whole, **reconciles** what the store
holds for that source against its own state and against the scan, then spends what is left of its budget **filling** in
detail. The scan is
repeated from scratch every run rather than recorded, which is what makes the three phases one pipe: no cursor, no
census of its own, no progress to corrupt, and every question the run asks is a comparison it makes at will.

| Question                  | Test                                                        |
|---------------------------|-------------------------------------------------------------|
| What no longer holds?     | stale by its own state, or absent from a complete scan      |
| What still needs filling? | never filled, or a marker past its stored copy              |
| What to attend to next?   | order by `updated` ascending, take `N`                      |

What holds throughout:

- **One item at a time** — the item is the unit of commit and of failure: read, judged and written on its own, so a
  mishap or a deadline cut costs exactly that item. Concurrency is a separate axis: several items may be in flight, each
  still committing on its own.

- **One staleness predicate per kind** — a single test judges an entry from its own state, and every phase applies it:
  the fill to what it just extracted, the reconcile to what the store holds. What the test reads is the kind's business
  and nobody else's: an event by its dates, a course by the end of its delivery. A kind with no such test rests on
  absence alone, and pays for it in how much a complete scan then matters.

- **Removal takes evidence** — an entry goes only on a positive fact about it: its own state condemning it, or a
  complete scan not listing it. A failed or inconclusive check leaves it alone for the next run.

- **A shared sink** — every phase states its conclusions as deltas and closes on one shared sink, which commits each
  delta on its own: store operations are already indivisible, and an item is one operation. A failed write is logged
  and counted, leaving the entry as it was and the feed running.

- **A rejected state ends the run** — a hostile response costs the item it concerns, but a state the shape refuses
  condemns every write alike and would hand back a clean run that stored nothing. That failure is propagated rather
  than counted, so the scheduler sees the attempt fail and retries it.

## Scan

Read every index page for the source's current set of entries, together with whatever marker the index carries for
each: a `modified` date, an entity tag, a digest of the row.

- **Repeated, not recorded** — seconds against a run measured in minutes, so rescanning from scratch buys away the
  cursor, the checkpoint and the stored census alike.

- **Complete or inconclusive** — pages all fetched, count reconciled against the totals the source reports. A scan
  falling short still feeds the fill and leaves the predicate free to retire what it judges, but licenses no removal
  drawn from absence.

- **A floor under the scan** — a search backend answering with zero results yields a complete, well-formed,
  catastrophic scan. One deviating too far from the stored count is refused before any removal is drawn from it.

## Reconcile

Judge what the store holds for the source, on two evidences that differ in what they need and in how much they carry.
Sources list past entries as a matter of course, so the predicate does the bulk of the retiring and absence covers what
it cannot see.

- **The predicate leads, and needs no scan** — the store's own copy settles expiry, so it is judged on every attempt,
  including one whose scan failed. The source is never asked to agree, and one that never delists costs nothing.

- **Absence follows, and needs a complete scan** — it catches only the entry withdrawn ahead of its own dates:
  cancelled, merged, pulled. A scan falling short licenses none of it.

- **Listed and already stale** — where the index carries the dates, the entry is judged at scan time and never filled,
  and is removed if the store holds it; where it doesn't, the judgement waits for the detail to be extracted.

- **Queries narrow, they don't decide** — the expiring entries of a source come from a targeted store query, but the
  predicate stays the authority. The query may over-select freely and must never under-select, or a class of entries
  becomes immortal.

- **Removals first** — cheap and bounded, against a fill that is neither, so a deadline cut costs pending detail rather
  than a postponed retraction.

- **Nothing sweeps across sources** — every removal is drawn for the source that claims the entry. Entries left behind
  by a source no longer configured at all belong to a maintenance pass, not to a scheduled run.

## Fill

Fetch and extract the detail of the entries the scan says need it, ordered by how long they have gone unattended.

- **Only a successful write advances its stamp** — the detail and the stamp justifying it land in one operation. A fill
  that dies leaves its entry pending, and re-filling an entry already current is a no-op.

- **A source marker beats a digest** — where the index carries one, keep it as the source reports it and fill on the
  marker moving past its stored copy. That skips the detail fetch outright, where a digest still pays for it.

- **Never compare a source stamp with one of ours** — different clocks, often different precision. A source value is
  compared only against the stored copy of itself, ours only against each other, all taken from the run's start.

- **A soft budget** — stop the fill short of the attempt deadline and answer for the run, so it ends on its own terms
  rather than being cancelled mid-write.

- **Overlap wastes, it does not corrupt** — an attempt still running when the scheduler retries draws the same work
  twice and nothing worse: upserts are idempotent and every removal is evidenced afresh. No lease to refresh, and none
  to expire at the wrong moment.

## Open

- **Where a sighted entry lives** — the scan knows of entries whose detail does not exist yet, and a skeleton neither
  satisfies the resource shape nor deserves serving. Either the scan's conclusions are held apart from the served
  resources, or the served shape tells filled from merely sighted.

- **Indexes too large to read whole** — a catalogue listed over hundreds of pages, or a search API refusing deep
  pagination, breaks the premise that the scan is cheap and repeatable. There a census returns as stored state, with a
  stamp of its own and the lease a resumable census needs. The premise is what selects the strategy, so it is worth
  checking per source rather than discovering under load.
