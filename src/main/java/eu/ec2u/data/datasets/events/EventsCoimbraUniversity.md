---
title: Coimbra › Events
summary: Integration status for Coimbra events
description: Integration status for the Coimbra university events dataset.
university: Coimbra
dataset: Events
status: active
version: 2022-02-26
---

Authoritative integration status for the Coimbra university events dataset.

# 2022-02-26 – AI extraction

Event catalogue extracted by scanning the site event search service; event info extracted by AI from event pages.
An alternate REST/JSON API is available at the [content API][content-api] (home page events at
`/v1/agenda/events/homepage`, search at `/v1/agenda/events/search`, event detail at `/v1/agenda/events/{event_key}`).

| Source                        | Notes                          |
|-------------------------------|--------------------------------|
| [agenda Coimbra][agenda-pt]   | Coimbra Agenda; Agenda Coimbra |

- **2025-05-08** – migrated from [agenda.uc.pt][agenda-uc] to [agenda.coimbra.pt][agenda-pt]
- **2022-02-26** – initial integration

[content-api]: https://content.fw.uc.pt
[agenda-pt]: https://agenda.coimbra.pt/
[agenda-uc]: https://agenda.uc.pt/
