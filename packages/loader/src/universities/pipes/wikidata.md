---
title: Universities › Wikidata
summary: Integration status for the Wikidata enrichment of the partner universities
description: Integration status for the Wikidata enrichment of the EC2U partner universities, not yet integrated.
status: planned
---

Authoritative integration status for the Wikidata enrichment of the nine EC2U partner universities.

# 2025-09-26 – Entity enrichment

Planned: background and statistical data drawn from the Wikidata entity each university is already linked to through the
`seeAlso` entry in `universities/index.json`, which stays the authority for the entity identifiers.

| Source                    | Description            | Notes                                                                              |
|---------------------------|------------------------|------------------------------------------------------------------------------------|
| https://www.wikidata.org/ | Wikidata entities [en] | One entity per partner university, named by `seeAlso` in `universities/index.json` |

- **2026-09-25** – retrieval from https://query.wikidata.org/sparql: earliest inception year, most recent best-rank
  student count, headquarters city (falling back to the administrative territory) and country; partners lacking any of
  these facts are skipped; cities and countries are stored as places of their own, with their English label and
  coordinates, and linked from each partner by their Wikidata IRI
- **2025-09-26** – placeholder pipe added, retrieval outstanding
