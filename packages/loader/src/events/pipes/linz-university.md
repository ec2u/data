---
title: Events › Linz › University
summary: Integration status for Linz events
description: Integration status for the Linz university events dataset.
status: active
---

Authoritative integration status for the Linz university events dataset.

# 2024-11-13 – AI extraction

Event info extracted by AI from the event catalogue and linked event pages.

| Source                                 | Description        |
|----------------------------------------|--------------------|
| https://www.jku.at/news-events/events/ | news & events [de] |

Event pages embed a schema.org `Event` as JSON-LD in the page head, with the name, the full description, the dates with
their offset, the venue and the image. Its text is still HTML-escaped, entities and non-breaking spaces included. Its
venue puts the whole street address in the locality. Its organiser may hold unrelated text, such as admission notes,
so the page text remains the source for the organiser, and every embedded value needs unescaping before use.

- **2024-11-13** – initial integration
