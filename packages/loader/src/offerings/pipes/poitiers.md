---
title: Offerings › Poitiers
summary: Integration status for the Poitiers University programs
description: Integration status for the degree programs of the University of Poitiers, current and planned sources.
status: active
---

Authoritative integration status for the University of Poitiers programs. The most recent version is listed first,
with the source still under evaluation; superseded versions are kept below for the record.

# Work in Progress – Ametys ODF platform

Ongoing evaluation of the live Ametys ODF training-offer platform as the source for programs and courses; all sources
below are still under consideration. The platform Web Services export works in push mode and would require a dedicated
API on the Knowledge Hub side, leaving OAI-PMH as the only viable route.

| Source                                                                           | Description                                     | Notes                                                             |
|----------------------------------------------------------------------------------|-------------------------------------------------|-------------------------------------------------------------------|
| https://formations.univ-poitiers.fr/                                             | training-offer site [fr]                        |                                                                   |
| https://formations.univ-poitiers.fr/fr/index.html                                | training-offer site, French home page [fr]      |                                                                   |
| [formations.univ-poitiers.fr/fr/rechercher-une-formation.html?…][odf-search]     | faceted search listing all degree programs [fr] |                                                                   |
| https://formations.univ-poitiers.fr/_odf/OAI                                     | Ametys ODF OAI-PMH endpoint [fr]                | answers 404; to be enabled by UniPoitiers                         |
| https://docs.ametys.org/fr/ametys-odf.html                                       | Ametys ODF overview [fr]                        | platform documentation                                            |
| [docs.ametys.org/fr/ametys-odf/presentation-generale-d-ametys-odf/…][odf-export] | training-offer export options [fr]              | platform documentation; covers push-mode Web Services and OAI-PMH |

- **2024-10-14** – approval to use the courses data in the RI4C2 databases still pending with its UniPoitiers owner
- **2024-04-25** – UniPoitiers to identify who can enable the OAI-PMH endpoint
- **2024-04-19** – candidate sources supplied by UniPoitiers

# 2022-10-21 – Static JSON snapshot

Programs loaded from a one-off JSON extract of the Poitiers offerings catalogue supplied by UniPoitiers and bundled with
the loader; no live feed is polled and courses are not ingested. Programs are stated one at a time and unchanged ones
skipped, so after the first run the pipe only restates what the August rollover of the academic year changes.

| Source                              | Description                      | Notes                                 |
|-------------------------------------|----------------------------------|---------------------------------------|
| `offerings/pipes/poitiers.json`     | Poitiers programs catalogue [fr] | harvested; unchanged since 2022-11-18 |

A program is keyed by its `code` and named in French as `code - name`; its `levelISCED` is mapped to ISCED 2011, its
positive `credits` kept and its `composante` stated as its provider, while its `discipline` guides the classification
of its field of education against ISCED-F 2013. The snapshot states no academic year, so programs are dated with the
academic year current at retrieval, switching in August, and marked as inferred. The `options` and the pedagogical
elements they list are not read.

- **2026-10-29** – ported to the TypeScript loader, with the snapshot moved into the loader sources; programs dated
	with the academic year current at retrieval and fields of education classified from the stated discipline
- **2022-11-18** – reshape the snapshot to the program/course data model, adding options and pedagogical elements
- **2022-10-21** – initial integration

[odf-search]: https://formations.univ-poitiers.fr/fr/rechercher-une-formation.html?user.input.facet.ContentReturnable%24ProgramSearchable%24indexingField%24org.ametys.plugins.odf.Content.program%24domain=content%3A%2F%2Fbdc4c9d8-d36e-4fff-aeb4-fc0293bf5ab6&submit-form=true#nav

[odf-export]: https://docs.ametys.org/fr/ametys-odf/presentation-generale-d-ametys-odf/export-de-l-offre-de-formation.html
