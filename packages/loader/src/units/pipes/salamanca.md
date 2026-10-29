---
title: Units › Salamanca
summary: Integration status for the Salamanca University research units
description: Integration status for the research units of Salamanca University, current and superseded source versions.
status: active
---

Authoritative integration status for the Salamanca University research units.

# 2022-09-07 – REST/JSON API

Recognised research groups (GIR) are drawn from a dedicated REST/JSON API, based on the same database feeding the GIR
portal (https://investigacion.usal.es/GIR) and authenticated by HTTP basic authentication, and stated one at a time,
so an interrupted run keeps the units it stated and the next one carries on; unchanged units are skipped. A listing
naming fewer than three quarters of the stored units retracts nothing and fails the run, as does a listing that fails
to be retrieved. Group memberships of EC2U virtual institutes come from a manually curated Google Sheet.

| Source                                        | Description                              | Notes                                                                  |
|-----------------------------------------------|------------------------------------------|------------------------------------------------------------------------|
| `units-salamanca-url`                         | Salamanca GIR API [es]                   | endpoint URL held in GCP Secret Manager under this key                 |
| `units-salamanca-key`                         | Salamanca GIR API credentials            | `user:password`, sent base64-encoded as HTTP basic authentication      |
| `units-salamanca-vis-url`                     | Group ‹› virtual institute sheet [en, es] | CSV export URL held in GCP Secret Manager under this key; header row |
| https://usal.es/institutos-investigacion      | research institutes [es]                 |                                                                        |
| https://investigacion.usal.es/es/empresas/gir | GIR companies [es]                       |                                                                        |

Each group is keyed by its API `id`, a string except for one group stated as a number, which is also stated as its
identifier; the listing repeats some groups, so each is stated once. The name is stated in Spanish and translated to
English, and the `topics` bullet list stands as the description. The scientific portal page and the head, written as
`Family, Given`, are carried over. The `institute` field lists the institutes a group belongs to, comma-separated, each
opening with `Instituto`; every institute is stated as a unit of its own, keyed by its name, under the university, with
the groups under it, while a group belonging to no institute stands directly under the university. The knowledge
branch and the RIS3 priority area guide the classification against EuroSciVoc, while the `department` fields, which the
legacy loader turned into units of their own, are now always empty and are ignored.

Virtual institute memberships are read from the sheet rows marked `Active`, joining the `Code` column, the API `id` of
the group, with the `VI` acronym. The sheet once named groups by their legacy ec2u/data IRIs in the `Unit` column,
which the current units no longer carry; the `Code` column was filled from those IRIs on 2026-10-28, matching all 99
rows, and the `Unit` column is kept for reference only, as the pipe reads the `Code` column alone to join memberships.

- **2026-10-28** – ported to the TypeScript loader: virtual institute sheet re-keyed by API id, inactive memberships
	left out, names translated to English, types and subjects classified with the API cues, unchanged units skipped
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
