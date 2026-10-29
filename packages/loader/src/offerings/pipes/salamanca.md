---
title: Offerings › Salamanca
summary: Integration status for the Salamanca University programs and courses
description: Integration status for the degree programs and courses listed by the University of Salamanca.
status: active
---

Authoritative integration status for the University of Salamanca programs and courses.

# 2023-01-12 – REST/JSON APIs

Programs, courses and their memberships are drawn from three REST/JSON APIs behind the study guides and stated one at a
time, so an interrupted run keeps the offerings it stated and the next one carries on; unchanged records are skipped. A
run naming fewer than three quarters of the stored offerings retracts nothing and fails, so a listing that fails to load
costs a run rather than the catalogue, and pruning below that share requires a forced reload.

| Source                 | Description     | Notes                                                                                                         |
|------------------------|-----------------|---------------------------------------------------------------------------------------------------------------|
| https://guias.usal.es/ | guías USAL [es] | programs, courses and memberships held in GCP Secret Manager as `offerings-salamanca-{programs,courses,programs-courses}-url` |

A program is keyed by its `programCode` and named in Spanish; a course is keyed by its `code`, named in English and
Spanish where the API states each, with its `ects` as credits and its teaching period (`A`, `S`, `Q`, `T`) as the time
it requires. The APIs state no academic year or term: offerings are dated with the academic year current at retrieval,
switching in August, and marked as inferred, while terms are left unstated. The memberships listing repeats some pairs
and names courses the
courses listing omits: each course links to the listed programs it is taught in, once, and memberships are read before
any course, so a memberships listing that fails to load or comes back empty fails the run before anything is stated.
Values are stripped of the stray quotes some reach the APIs wrapped in, which would otherwise surface in the labels.

- **2026-10-29** – ported to the TypeScript loader: offerings stated one at a time with unchanged records skipped and a
	retraction floor; course memberships read up front, failing the run when they are missing
- **2026-09-21** – strip matching leading/trailing quotes from source values
- **2023-03-29** – remove patches for clashing offer names
- **2023-03-02** – integrate programs and programs-courses APIs
- **2023-01-17** – integrate `schema:timeRequired`
- **2023-01-12** – initial integration
