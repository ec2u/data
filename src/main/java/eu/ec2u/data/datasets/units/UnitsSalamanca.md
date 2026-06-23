---
title: Salamanca › Units
summary: Integration status for Salamanca research units
description: Integration status for the Salamanca university research units dataset.
university: Salamanca
dataset: Units
status: active
version: 2022-09-07
---

Authoritative integration status for the Salamanca university research units dataset.

# 2022-09-07 – REST/JSON API

General research unit data extracted from a dedicated REST/JSON API, based on the same database feeding the
[GIR portal][gir-portal].

- general research unit data extracted from dedicated REST/JSON API
- research unit ‹› virtual institute associations extracted from manually curated Google Sheet

| Source                                  | Notes |
|-----------------------------------------|-------|
| [research institutes][institutos]       |       |
| [GIR companies][gir-empresas]           |       |

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
    - [institutos-investigacion][rss-institutos]
    - [centros-propios][rss-centros]
- ~~Microdata~~
    - no annotations, but USAL available to add if required and under guidance

[gir-portal]: https://investigacion.usal.es/GIR
[institutos]: https://usal.es/institutos-investigacion
[gir-empresas]: https://investigacion.usal.es/es/empresas/gir
[rss-institutos]: https://usal.es/rss/institutos-investigacion
[rss-centros]: https://usal.es/rss/centros-propios
