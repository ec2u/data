---
title: Events › Coimbra › University
summary: Integration status for Coimbra events
description: Integration status for the Coimbra university events dataset.
status: active
---

Authoritative integration status for the Coimbra university events dataset.

# 2022-02-26 – AI extraction

Event catalogue extracted by scanning the site event search service; event info extracted by AI from event pages.

| Source                     | Description         | Notes                                                                                                                                     |
|----------------------------|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| https://agenda.coimbra.pt/ | agenda Coimbra [pt] | harvested                                                                                                                                 |
| https://content.fw.uc.pt   | content API [pt]    | alternate REST/JSON API; homepage `/v1/agenda/events/homepage`, search `/v1/agenda/events/search`, detail `/v1/agenda/events/{event_key}` |

- **2025-05-08** – migrated from https://agenda.uc.pt/ to https://agenda.coimbra.pt/
- **2022-02-26** – initial integration
