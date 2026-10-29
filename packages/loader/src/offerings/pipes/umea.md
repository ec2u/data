---
title: Offerings › Umeå
summary: Integration status for the Umeå University programs and courses
description: Integration status for the Umeå University programs and courses, current and superseded source versions.
status: active
---

Authoritative integration status for the Umeå University programs and courses. The most recent version is listed
first; superseded versions, with the sources they read, are kept below for the record.

# 2025-11-05 – REST/JSON API

Offering pages listed by the undocumented REST/JSON search API behind the study catalogue, each page read and its
offering extracted by model, then stated one at a time, so an interrupted run keeps the offerings it stated and the next
one carries on; a page whose content is unchanged is fetched but not extracted again. A run naming fewer than three
quarters of the stored offerings retracts nothing and fails, so a listing that fails to load costs a run.

| Source                                                            | Description               | Notes                                                       |
|-------------------------------------------------------------------|---------------------------|-------------------------------------------------------------|
| https://www.umu.se/utbildning/valj-utbildning/program-och-kurser/ | programs and courses [sv] | search API held in GCP Secret Manager as `offerings-umea-url` |

The API is asked for every page under the `program` and `kurs` content labels, read as programs and courses and keyed
by their page address. The listing facts (title, code, credits, level) are not read: names, descriptions, contents,
outcomes, requirements, credits, credentials, level, duration and, for courses, code, workload, teaching language, fees
and attendance mode are extracted from the page in its language, then translated to English and classified as needed.
Pages state no academic year or term: offerings are dated with the academic year current at retrieval, switching in
August, and marked as inferred. A page that fails to load is skipped and stays listed, so it is never retracted for it.

- **2026-10-29** – ported to the TypeScript loader, programs and courses harvested by a single pipe: pages are read on
	every run and extracted again only when their content changes, replacing the 30-day refresh and `publishDate`
	stamps; pages are retracted only once the listing drops them, no longer after consecutive failures
- **2026-07-22** – switched to incremental crawling: pages are queued only when never fetched, reported as republished
  by the API `publishDate`, or older than 30 days, then processed in checkpointed batches within a per-run time budget,
  so a run resumes where the previous one stopped; pages dropped from the listing or unavailable after three
  consecutive attempts are retired together with the resources they generated
- **2026-07-21** – extract a prospective-student description (`schema:description`) alongside the summary, and focus
  `schema:teaches` on goals, structure and contents
- **2025-11-05** – migrated from paginated HTML scraping to REST/JSON API (website now uses Vue.js SPA with dynamic
  content)
	- initial implementation used sitemap-based discovery, then migrated to direct API access

# 2025-05-29 – HTML scraping

Offerings data harvested by paginated HTML scraping of the program and course listing pages.

| Source                                                            | Description               |
|-------------------------------------------------------------------|---------------------------|
| https://www.umu.se/utbildning/valj-utbildning/program-och-kurser/ | programs and courses [sv] |

- **2025-05-29** – initial integration
