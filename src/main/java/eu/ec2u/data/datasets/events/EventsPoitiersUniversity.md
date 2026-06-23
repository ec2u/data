---
title: Poitiers › Events
summary: Integration status for Poitiers events
description: Integration status for the Poitiers university events dataset, current and superseded source versions.
university: Poitiers
dataset: Events
status: active
version: 2025-05-07
---

Authoritative integration status for the Poitiers university events dataset. The most recent version is listed first;
superseded versions are kept below for the record.

# 2025-05-07 – AI extraction

Event info extracted by AI from the [event catalogue][poitiers-search] and linked event pages.

| Source                      | Notes                                                                                      |
|-----------------------------|--------------------------------------------------------------------------------------------|
| [actualités][poitiers-actu] | University of Poitiers / News and Events; Université de Poitiers / Actualités et événements |

- **2025-05-07** – migrated to AI extraction

# 2022-02-26 – RSS adapter

Custom RSS adapter parsing the source feed and its extended custom fields.

| Source                      | Notes                                                                                      |
|-----------------------------|--------------------------------------------------------------------------------------------|
| [actualités][poitiers-actu] | University of Poitiers / News and Events; Université de Poitiers / Actualités et événements |

- **2024-04-24** – extended to [the feed][poitiers-feed]; fixed location IRI generation
- **2022-05-30** – updated RSS feed URL; extract `schema:image`
- **2022-05-20** – migrated to custom RSS adapter to take advantage of extended custom fields
- **2022-02-26** – initial integration

[poitiers-search]: https://www.univ-poitiers.fr/searchevents/
[poitiers-actu]: https://www.univ-poitiers.fr/c/actualites/
[poitiers-feed]: https://www.univ-poitiers.fr/feed
