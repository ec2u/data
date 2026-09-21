---
title: Offerings › Poitiers
summary: Integration status for Poitiers offerings
description: Integration status for the Poitiers university offerings dataset.
status: active
---

Authoritative integration status for the Poitiers offerings dataset.

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

Programs loaded from a one-off JSON extract of the Poitiers offerings catalogue supplied by UniPoitiers and bundled as a
project resource; no live feed is polled and courses are not ingested.

| Source                                        | Description                      | Notes                                    |
|-----------------------------------------------|----------------------------------|------------------------------------------|
| `src/main/resources/…/OfferingsPoitiers.json` | Poitiers programs catalogue [fr] | harvested; unchanged since 2022-11-18    |
| none                                          | Poitiers offerings REST/JSON API | `offers-poitiers-*` vault secrets unused |

- **2022-11-18** – reshape the snapshot to the program/course data model, adding options and pedagogical elements
- **2022-10-21** – initial integration

[odf-search]: https://formations.univ-poitiers.fr/fr/rechercher-une-formation.html?user.input.facet.ContentReturnable%24ProgramSearchable%24indexingField%24org.ametys.plugins.odf.Content.program%24domain=content%3A%2F%2Fbdc4c9d8-d36e-4fff-aeb4-fc0293bf5ab6&submit-form=true#nav

[odf-export]: https://docs.ametys.org/fr/ametys-odf/presentation-generale-d-ametys-odf/export-de-l-offre-de-formation.html
