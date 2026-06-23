---
title: Units › Salamanca
summary: Integration status for Salamanca research units
description: Integration status for the Salamanca university research units dataset.
status: active
---

Authoritative integration status for the Salamanca university research units dataset.

# 2022-09-07 – REST/JSON API

General research unit data extracted from a dedicated REST/JSON API, based on the same database feeding the GIR portal
(https://investigacion.usal.es/GIR). Research unit ‹› virtual institute associations are extracted from a manually
curated Google Sheet.

| Source                                        | Description              |
|-----------------------------------------------|--------------------------|
| https://usal.es/institutos-investigacion      | research institutes [es] |
| https://investigacion.usal.es/es/empresas/gir | GIR companies [es]       |

- **2022-10-20** – automated ingestion of research unit ‹› virtual institute associations
- **2022-10-06** – extract institute data
	- add branch/RIS3 classification
	- add homepage link
	- add virtual institute membership
- **2022-09-26** – extract department data
- **2022-09-23** – add `org:classification` data
- **2022-09-07** – initial integration from REST/JSON API

## Notes

Retired sources:

- ~~RSS Feeds~~
	- https://usal.es/rss/institutos-investigacion
	- https://usal.es/rss/centros-propios
- ~~Microdata~~
	- no annotations, but USAL available to add if required and under guidance
