---
title: Events › Pipes › Work
summary: Requirements for incremental event ingestion
description: Requirements for reworking the event pipes into an incremental sync.
status: draft
---

Requirements for reworking `diff`/`sync` into a genuinely incremental ingestion.

# Requirements

- **Incremental** — each run does only the work the store hasn't already got.
- **Graceful under deadlines** — a run cut short leaves the store consistent; the next run carries on.
- **Graceful under mishaps** — fetch failures and remote service failures are absorbed, not fatal, and never
  interpreted as absence: an unreachable source is not a retraction.
- **Scheduled** — run by the GCP scheduler, as a `job()` endpoint.
- **Budget** — a couple of minutes per run once the store is primed.


# Decisions

Two workflows, scheduled independently: a per-source **harvester** turning a feed of URLs into upserts, and a shared
**reaper** removing stale events across sources. What holds for both:

- **One item at a time** — the item is the unit of commit and of failure: read, judged and written on its own, so a
  mishap or a deadline cut costs exactly that item. Concurrency is a separate axis: several items may be in flight,
  each still committing on its own.

- **One staleness predicate** — `isStale` judges an event from its own state, and both workflows apply it: the
  harvester to what it just extracted, the reaper to what the store holds.

- **Removal takes evidence** — an event goes only on a positive fact about it. Nothing is removed because it was not
  seen, and a failed or inconclusive check leaves it alone for the next run.

- **A shared sink** — both flows state their conclusions as deltas and close on the same `persist` sink, which commits
  each delta on its own. No transaction: store operations are already individually atomic, and an item is one
  operation. A failed write is logged and counted, leaving the event as it was and the feed running.

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
