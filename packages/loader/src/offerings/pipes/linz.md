---
title: Offerings › Linz
summary: Integration status for the Linz University programs and courses
description: Integration status for the degree programs and courses listed by Linz University.
status: active
---

Authoritative integration status for the Linz University programs and courses.

# 2025-03-24 – REST/JSON APIs

Programs and courses are drawn from two REST/JSON APIs and stated one at a time, so an interrupted run keeps the
offerings it stated and the next one carries on; unchanged records are skipped. A run naming fewer than three quarters
of the stored programs and courses retracts nothing and fails, so a listing that fails to load costs a run rather than
the catalogue: a pruning below that share requires a forced reload, once the withdrawal is confirmed with the university.

| Source                                     | Description          | Notes                                                      |
|--------------------------------------------|----------------------|------------------------------------------------------------|
| https://ec2u.datahub.jku.at/api/1/programs | degree programs [de] | held in GCP Secret Manager as `programs-linz-url`          |
| https://ec2u.datahub.jku.at/api/1/courses  | courses [de, en]     | held in GCP Secret Manager as `courses-linz-url`; no descriptions |

A program is keyed by its first `identifier`, a course by its `courseCode`; the APIs state no academic year or term, so
offerings are dated with the academic year current at retrieval, switching in August, and marked as inferred, while
terms are left unstated; a course listed more than once is stated once. Names and descriptions keep the
languages the records tag them with, a German-only text being translated to English. `educationalLevel` states a legacy
`/concepts/isced-2011/{level}` address, mapped to the ISCED 2011 taxonomy, and a field of education is classified from
the texts against ISCED-F 2013. A course names its programs by their first `identifier` in `inProgram`, and a
`Lifelong Learning` audience tags it as addressed to continuing education students.

- **2026-10-29** – ported to the TypeScript loader: offerings stated one at a time with unchanged records skipped and a
	retraction floor; German-only texts translated to English and fields of education classified against ISCED-F 2013
- **2026-09-11** – map the course `audience` field to EC2U stakeholder topics, tagging lifelong-learning courses as
	continuing-education students
- **2026-09-07** – fix the nightly crawling URL, which pointed to a non-existent `/programs` sub-route and silently
	returned 404 since 2025-02-11
- **2025-04-28** – update courses pipeline to read `educationalLevel` directly from the course description
- **2025-03-24** – initial integration
