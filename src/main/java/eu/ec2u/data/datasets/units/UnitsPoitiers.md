---
title: Units › Poitiers
summary: Integration status for Poitiers research units
description: Integration status for the Poitiers research units dataset, current and superseded sources.
status: active
---

Authoritative integration status for the Poitiers university research units dataset. The most recent version is listed
first; superseded versions are kept below for the record.

# 2024-04-24 – RNSR REST/JSON API

Data loaded from the REST/JSON API provided by the RNSR national catalog. Source pointers provided by UniPoitiers on
2024-04-09.

| Source                                                                  | Description                          | Notes                                        |
|-------------------------------------------------------------------------|--------------------------------------|----------------------------------------------|
| [data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/…][rnsr-all]   | RNSR records, all structures [fr]    | harvested; Université de Poitiers as tutelle |
| [data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/…][rnsr-labs]  | RNSR records, laboratories only [fr] |                                              |
| [data.enseignementsup-recherche.gouv.fr/explore/…][rnsr-table]          | RNSR table view [fr]                 |                                              |
| https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/console | RNSR Explore console [fr]            | API docs                                     |
| [aurehal.archives-ouvertes.fr/structure/browse/…][aurehal-table]        | auréHal table view [fr]              |                                              |
| [api.archives-ouvertes.fr/ref/structure/…][aurehal-json]                | auréHal JSON [fr]                    |                                              |

- **2024-04-24** – initial integration

# 2022-12-10 – Curated Google Sheet

Data loaded from a manually curated Google Sheet.

- **2022-12-10** – initial integration

[rnsr-all]: https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/records?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles

[rnsr-labs]: https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/records?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles%20AND%20code_de_niveau_de_structure%20%3D%202

[rnsr-table]: https://data.enseignementsup-recherche.gouv.fr/explore/embed/dataset/fr-esr-structures-recherche-publiques-actives/table/?disjunctive.numero_national_de_structure&disjunctive.type_de_structure&disjunctive.tutelles&refine.tutelles=Universit%C3%A9%20de%20Poitiers&refine.type_de_structure=Unit%C3%A9%20mixte&refine.type_de_structure=Unit%C3%A9%20propre

[aurehal-table]: https://aurehal.archives-ouvertes.fr/structure/browse/critere/parentDocid_i%3A54493/solR/1/page/1/nbResultPerPage/200/tri/valid/filter/valid/category/%2A

[aurehal-json]: http://api.archives-ouvertes.fr/ref/structure/?q=parentDocid_i:54493&fq=valid_s:VALID
