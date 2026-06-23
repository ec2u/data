---
title: Events › Poitiers › University
summary: Integration status for Poitiers events
description: Integration status for the Poitiers university events dataset, current and superseded source versions.
status: active
---

Authoritative integration status for the Poitiers university events dataset. The most recent version is listed first;
superseded versions are kept below for the record.

# 2025-05-07 – AI extraction

Event info extracted by AI from the event catalogue and linked event pages.

| Source                                     | Description          |
|--------------------------------------------|----------------------|
| https://www.univ-poitiers.fr/searchevents/ | event catalogue [fr] |
| https://www.univ-poitiers.fr/c/actualites/ | actualités [fr]      |

- **2025-05-07** – migrated to AI extraction

# 2022-02-26 – RSS adapter

Custom RSS adapter parsing the source feed and its extended custom fields.

| Source                                     | Description     |
|--------------------------------------------|-----------------|
| https://www.univ-poitiers.fr/c/actualites/ | actualités [fr] |
| https://www.univ-poitiers.fr/feed          | RSS feed [fr]   |

- **2024-04-24** – extended to the feed; fixed location IRI generation
- **2022-05-30** – updated RSS feed URL; extract `schema:image`
- **2022-05-20** – migrated to custom RSS adapter to take advantage of extended custom fields
- **2022-02-26** – initial integration
