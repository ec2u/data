---
title: Turku › Events
summary: Integration status for Turku events
description: Integration status for the Turku university events dataset, current and superseded source versions.
university: Turku
dataset: Events
status: active
version: 2025-05-07
---

Authoritative integration status for the Turku university events dataset. The most recent version is listed first;
superseded versions are kept below for the record.

# 2025-05-07 – AI extraction

Event info extracted by AI from the event catalogue and linked event pages.

| Source                            | Notes                                                       |
|-----------------------------------|-------------------------------------------------------------|
| [event search][utu-event-search]  | University of Turku / News; Turun yliopisto / Ajankohtaista |

- **2025-05-07** – initial integration

# 2022-03-19 – Events API

Custom adapter; access key stored on GCP Secret Manager; required contact address provided by MMT.

| Source                          | Notes                                                          |
|---------------------------------|----------------------------------------------------------------|
| [events API][utu-events-api]    | JSON; proxy of the IP-restricted [internal API][utu-api-int]   |

- **2022-06-07** – fixed conflicting labels for online locations (same meeting URL reused across events)
- **2022-03-19** – initial integration

[utu-event-search]: https://www.utu.fi/event-search
[utu-events-api]: https://api-ext.utu.fi/events/v1/public
[utu-api-int]: https://api.utu.fi/events/v1/public
