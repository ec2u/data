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
  which the scheme is half replaced.

# Incremental sources

Two workflows, scheduled independently: a per-source **harvester** turning a feed of URLs into upserts, and a shared
**reaper** removing stale events across sources. What holds for both:

- **One item at a time** — the item is the unit of commit and of failure: read, judged and written on its own, so a
  mishap or a deadline cut costs exactly that item. Concurrency is a separate axis: several items may be in flight, each
  still committing on its own.

- **One staleness predicate** — a single test judges an event from its own state, and both workflows apply it: the
  harvester to what it just extracted, the reaper to what the store holds.

- **Removal takes evidence** — an event goes only on a positive fact about it. Nothing is removed because it was not
  seen, and a failed or inconclusive check leaves it alone for the next run.

- **A shared sink** — both flows state their conclusions as deltas and close on one shared sink, which commits
  each delta on its own. No transaction: store operations are already indivisible, and an item is one operation. A
  failed write is logged and counted, leaving the event as it was and the feed running.

- **A floor under the run** — absorbing every failure would let a store-wide fault read as a clean run that wrote
  nothing, so a run failing every write it attempts rejects and the scheduler retries it.

## Harvester

- **Asserts only what it saw** — every write records an observation, so the run needs no completion flag and a deadline
  cut is a non-event: the next run picks up the rest.

- **Drops what it finds stale** — an extracted event failing the predicate is not written, and is removed if the store
  already holds it.

## Reaper

- **Several criteria, not one sweep** — each criterion selects its own candidates and carries its own cost, so a cheap
  state-only test and an expensive probing one get separate budgets per run.

- **Queries narrow, they don't decide** — candidates come from a targeted store query, but the predicate stays the
  authority. The query may over-select freely and must never under-select, or a class of events becomes immortal.

- **Delisting is evidenced, not inferred** — a criterion re-fetches an event's source page and removes it on a definite
  gone response. A timeout, a `5xx` or a DNS failure means can't tell: the event stays and the check retries next run.
  This needs no stored state: an event retains its source URL.

- **Rotation by stamp** — a probing criterion takes the candidates written least recently, so successive runs cover the
  whole set without keeping progress of their own.

## Catalogues at scale

Open, for catalogues of thousands of entries listed over tens of index pages, where a priming run cannot finish in one
attempt.

Split the run in two, as the halves differ in what they can promise:

- **Census** — read every index page for the current set of entries. Seconds, and it completes within one attempt, so
  the index is read as an atomic source: completeness is checkable (pages all fetched, count reconciled against the
  totals the source reports) and inside a complete census absence **is** evidence. Removals key off this alone, and off
  a census taken this run.

- **Fill** — fetch and extract the detail of the entries that need it. Arbitrarily many attempts, never required to
  finish.

Then a run cut short costs progress, never correctness: it retracted against a whole census while leaving detail undone.

**Work is a query, not a cursor.** Resources are timestamped anyway, so two stamps carry the whole state and every
question the run has to ask is a comparison between them:

| Question                       | Test                                   |
|--------------------------------|----------------------------------------|
| What still needs filling?      | `surveyed > updated`                   |
| What has gone from the source? | `surveyed < this run's census stamp`   |
| What to attend to next?        | order by `updated` ascending, take `N` |

There is no progress to checkpoint, so there is none to corrupt, and a priming run differs from a steady one only in how
many rows come back.

- **Only a successful write advances its own stamp** — the census advances `surveyed`, the fill advances `updated` in
  the same operation as the state that justifies it. A fill that dies leaves its entry pending, and re-filling an entry
  already current is a no-op.

- **A source date beats a digest** — where the index carries one, keep it as the source reports it and fill on
  `modified` past its stored copy. That skips the detail fetch outright, where a digest still pays for it.

- **Never compare a source stamp with one of ours** — different clocks, often different precision. A source value is
  compared only against the stored copy of itself, ours only against each other, all taken from the run's start.

- **A lease** — a timed-out attempt may still be running when the scheduler retries, and both would draw the same work.
  One record with a short expiry, refreshed as the run proceeds; a run finding it live exits.

- **A soft budget** — stop the fill short of the attempt deadline and answer `200`, so the run ends on its own terms
  rather than being cancelled and retried against its own lease.

- **A floor on the census** — a search backend answering with zero results yields a complete, well-formed, catastrophic
  census. A census deviating too far from the stored count is refused before any removal is drawn from it.

- **Where a sighted entry lives** — the census stamps entries whose detail does not exist yet, and a skeleton neither
  satisfies the resource shape nor deserves serving. Either the census keeps a manifest of its own, or the served shape
  tells filled from merely sighted. The one decision the stamps force rather than remove.
