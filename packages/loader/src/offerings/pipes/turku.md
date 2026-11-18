---
title: Offerings › Turku
summary: Integration status for the University of Turku programs and courses
description: Integration status for the degree programs and courses of the University of Turku, all sources planned.
status: planned
---

Authoritative integration status for the University of Turku programs and courses, not yet integrated.

# Work in Progress – Peppi API and public programme pages

Two routes are under consideration: the dedicated EC2U API UTU opened on its Peppi study information system, for
programs and courses alike, and the public programme pages of the university site, for programs alone in the meantime.

| Source                                                                     | Description                   | Notes                                                    |
|----------------------------------------------------------------------------|-------------------------------|----------------------------------------------------------|
| https://api-ext.utu.fi/peppi/ec2u/api/v1/ec2u/programs                     | Peppi EC2U API, programs [en] | key-based access; answers `403` with no valid key        |
| https://api-ext.utu.fi/peppi/ec2u/api/v1/ec2u/courses                      | Peppi EC2U API, courses [en]  | key-based access; answered `504` on the full course feed |
| https://www.utu.fi/sitemap.xml                                             | university sitemap [en, fi]   | about 43,000 pages, paged as `/def/sitemap.xml?page=1…9` |
| https://www.utu.fi/en/study-at-utu/bachelors-and-masters-degree-programmes | degree programmes [en]        | index of the English-taught programme pages              |

The Peppi API is the agreed route and the only one covering courses: UTU built it for EC2U, with programs linking their
courses by code, but the key issued in 2024 no longer opens it and none is held in the vault, so integration waits for a
working key and the paginated endpoints UTU announced, to be requested from its Peppi team.

Meanwhile, the sitemap lists about 40 English-taught programme pages (`/en/study-at-utu/…-degree-programme-in-…`), each
stating in a fixed block its credits, planned duration, qualification, start, location, language, mode of teaching,
faculty, annual quota and tuition fees, followed by a prose description of contents and outcomes. They would support a
crawl like the Pavia portal catalogues, programs only, keyed by page address. Course lists sit in the study guide
(`opas.peppi.utu.fi`), a client-side application publishing no sitemap or documented API, so it is not a source. Open
university and continuous learning offerings are published under `/fi/avoin-yliopisto-opetus` and
`/fi/jatkuva-oppiminen`, in Finnish, and remain to be surveyed as a source of courses open to non-degree students.

- **2026-10-29** – public programme pages surveyed as an interim source of programs; Peppi API still refusing access
- **2024-10-08** – UTU reworked the API to paginate programs and courses; both endpoints answer `403`, key to be checked
- **2024-05-08** – endpoints opened behind an API key; courses answer `504` once widened to all teaching languages
- **2023-09-11** – key-based access requested in place of IP filtering, along with all teaching languages
- **2023-09-08** – UTU announced the EC2U API for currently valid courses and programmes taught in English
