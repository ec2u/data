---
title: Units › Poitiers
summary: Integration status for the Poitiers University research units
description: Integration status for the research units of Poitiers University, current and superseded source versions.
status: active
---

Authoritative integration status for the Poitiers University research units, most recent version first, with the
superseded versions kept below for the record of how the source was harvested before.

# 2024-04-24 – RNSR REST/JSON API

Units are drawn from the JSON export of the French national register of research structures (RNSR), filtered to the
structures Université de Poitiers is a supervising body (`tutelle`) of, and stated one at a time, so an interrupted run
keeps the units it stated and the next one carries on; unchanged structures are skipped. An export naming fewer than
three quarters of the stored units retracts nothing and fails the run, as does an export that fails to be retrieved;
the source pointers below were provided by Poitiers University on 2024-04-09, when the register replaced the sheet.

| Source                                                                   | Description                           | Notes                                        |
|--------------------------------------------------------------------------|---------------------------------------|----------------------------------------------|
| [data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/…][rnsr-export] | RNSR bulk export, all structures [fr] | harvested; Université de Poitiers as tutelle |
| [data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/…][rnsr-all]    | RNSR records, all structures [fr]     | paged variant of the harvested query         |
| [data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/…][rnsr-labs]   | RNSR records, laboratories only [fr]  |                                              |
| [data.enseignementsup-recherche.gouv.fr/explore/…][rnsr-table]           | RNSR table view [fr]                  |                                              |
| https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/console  | RNSR Explore console [fr]             | API docs                                     |

Each structure states one unit, keyed by its national structure number (`numero_national_de_structure`), which is also
stated as its identifier, with its register record (`fiche_rnsr`) as the page defining it. The name (`libelle`) is
stated in French, as the register writes it in capitals, and translated to English; the acronym and the website are
carried over. Missing facts come as `null` rather than being left out. People in charge (`prenom_du_responsable` and
`nom_du_responsable`, paired by position) are stated as heads, deputies included, while a parent structure is linked
only when the export lists it, as some parents belong to other institutions. The structure type and the scientific
domains guide the classification against the EC2U organisation taxonomy and EuroSciVoc.

- **2026-10-28** – ported to the TypeScript loader: names translated to English, types and subjects classified against
	the taxonomies with the register type and domains as cues, parents linked within the export, all heads stated, and
	unchanged structures skipped on later runs, so an interrupted run carries on where it stopped
- **2024-04-24** – initial integration

# 2022-12-10 – Curated Google Sheet

Data loaded from a manually curated Google Sheet.

| Source | Notes |
|--------|-------|
| none   |       |

- **2022-12-10** – initial integration

## Notes

Alternative source pointed out by Poitiers University on 2024-04-09 and never integrated:

- ~~[aurehal.archives-ouvertes.fr/structure/browse/…][aurehal-table]~~ – auréHal table view [fr]
- ~~[api.archives-ouvertes.fr/ref/structure/…][aurehal-json]~~ – auréHal JSON [fr]

[rnsr-export]: https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/exports/json?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles

[rnsr-all]: https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/records?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles

[rnsr-labs]: https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/records?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles%20AND%20code_de_niveau_de_structure%20%3D%202

[rnsr-table]: https://data.enseignementsup-recherche.gouv.fr/explore/embed/dataset/fr-esr-structures-recherche-publiques-actives/table/?disjunctive.numero_national_de_structure&disjunctive.type_de_structure&disjunctive.tutelles&refine.tutelles=Universit%C3%A9%20de%20Poitiers&refine.type_de_structure=Unit%C3%A9%20mixte&refine.type_de_structure=Unit%C3%A9%20propre

[aurehal-table]: https://aurehal.archives-ouvertes.fr/structure/browse/critere/parentDocid_i%3A54493/solR/1/page/1/nbResultPerPage/200/tri/valid/filter/valid/category/%2A

[aurehal-json]: http://api.archives-ouvertes.fr/ref/structure/?q=parentDocid_i:54493&fq=valid_s:VALID
