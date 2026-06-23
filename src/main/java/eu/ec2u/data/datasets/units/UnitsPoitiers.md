---
title: Poitiers › Units
summary: Integration status for Poitiers research units
description: Integration status for the Poitiers research units dataset, current and superseded sources.
university: Poitiers
dataset: Units
status: active
version: 2024-04-24
---

Authoritative integration status for the Poitiers university research units dataset. The most recent version is listed
first; superseded versions are kept below for the record.

# 2024-04-24 – RNSR REST/JSON API

Data loaded from the REST/JSON API provided by the RNSR national catalog. API docs at the
[Explore console][rnsr-console].

| Source                                                       | Notes                                                 |
|--------------------------------------------------------------|-------------------------------------------------------|
| RNSR `fr-esr-structures-recherche-publiques-actives` records | all structures with Université de Poitiers as tutelle |

- **2024-04-24** – initial integration

Source pointers provided by UniPoitiers on 2024-04-09.

- **RNSR**
    - [table view][rnsr-table]
    - [json, all structures][rnsr-json-all]
    - [json, only laboratories][rnsr-json-labs]
- **auréHal**
    - [table view][aurehal-table]
    - [json][aurehal-json]

# 2022-12-10 – Curated Google Sheet

Data loaded from a manually curated Google Sheet.

| Source | Notes |
|--------|-------|
| none   |       |

- **2022-12-10** – initial integration

[rnsr-console]: https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/console
[rnsr-table]: https://data.enseignementsup-recherche.gouv.fr/explore/embed/dataset/fr-esr-structures-recherche-publiques-actives/table/?disjunctive.numero_national_de_structure&disjunctive.type_de_structure&disjunctive.tutelles&refine.tutelles=Universit%C3%A9%20de%20Poitiers&refine.type_de_structure=Unit%C3%A9%20mixte&refine.type_de_structure=Unit%C3%A9%20propre
[rnsr-json-all]: https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/records?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles
[rnsr-json-labs]: https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/records?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles%20AND%20code_de_niveau_de_structure%20%3D%202
[aurehal-table]: https://aurehal.archives-ouvertes.fr/structure/browse/critere/parentDocid_i%3A54493/solR/1/page/1/nbResultPerPage/200/tri/valid/filter/valid/category/%2A
[aurehal-json]: http://api.archives-ouvertes.fr/ref/structure/?q=parentDocid_i:54493&fq=valid_s:VALID
