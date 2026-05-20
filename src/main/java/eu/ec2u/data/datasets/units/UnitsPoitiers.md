# Sources

- none

# Integration

- data loaded from a REST/JSON API provided by a national catalog
- APi docs @ https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/console

## 2024-04-24

- upgrade to REST/JSON API provided by RNSR national catalog
  - https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/records?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles

## 2022-12-10

- Initial integration from manually curated Google Sheet

# Samples

```json
{
  "total_count": 59,
  "results": [
    {
      "numero_national_de_structure": "199814145N",
      "libelle": "INSTITUT DE DROIT PUBLIC",
      "sigle": "IDP",
      "annee_de_creation": "1998",
      "type_de_structure": "Unité propre",
      "code_de_type_de_structure": "21",
      "code_de_niveau_de_structure": "2",
      "site_web": "http://droit.univ-poitiers.fr/recherche/les-equipes-de-recherche/institut-de-droit-public-idp-/",
      "adresse": "IDP - Faculté de Droit et de Sciences Sociales - Université de Poitiers - Bâtiment E9 - 43 Place Charles de Gaulle - TSA 81100",
      "code_postal": "86073",
      "commune": "POITIERS CEDEX 9",
      "nom_du_responsable": [
        "BRENET"
      ],
      "prenom_du_responsable": [
        "François"
      ],
      "titre_du_responsable": [
        "Directeur"
      ],
      "label_numero": [
        "UR 14145"
      ],
      "tutelles": [
        "Université de Poitiers"
      ],
      "sigles_des_tutelles": [
        "UP"
      ],
      "code_de_nature_de_tutelle": [
        "UNIV"
      ],
      "nature_de_tutelle": [
        "Université"
      ],
      "uai_des_tutelles": [
        "0860856N"
      ],
      "siret_des_tutelles": [
        "19860856400375"
      ],
      "code_de_type_de_tutelle": [
        "TUTE"
      ],
      "type_de_tutelle": [
        "établissement tutelle"
      ],
      "numero_de_structure_enfant": null,
      "numero_de_structure_parent": null,
      "numero_de_structure_historique": null,
      "type_de_succession": null,
      "code_de_type_de_succession": null,
      "annee_d_effet_historique": null,
      "code_domaine_scientifique": [
        "7"
      ],
      "domaine_scientifique": [
        "Sciences de la société"
      ],
      "code_panel_erc": "SH2",
      "panel_erc": [
        "Institutions, Governance and Legal Systems : Political science, international relations, law"
      ],
      "fiche_rnsr": "https://appliweb.dgri.education.fr/rnsr/PresenteStruct.jsp?numNatStruct=199814145N&PUBLIC=OK"
    },
    …
  ]
}
```

---

# Notes

Source pointers provided by UniPoitiesr on 2024-04-09.

- **RNSR**
    - table view
      https://data.enseignementsup-recherche.gouv.fr/explore/embed/dataset/fr-esr-structures-recherche-publiques-actives/table/?disjunctive.numero_national_de_structure&disjunctive.type_de_structure&disjunctive.tutelles&refine.tutelles=Universit%C3%A9%20de%20Poitiers&refine.type_de_structure=Unit%C3%A9%20mixte&refine.type_de_structure=Unit%C3%A9%20propre
    - json all structures ():
      https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/records?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles
    - json only laboratories :
      https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/records?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles%20AND%20code_de_niveau_de_structure%20%3D%202
- **auréHal**
    - table view
      https://aurehal.archives-ouvertes.fr/structure/browse/critere/parentDocid_i%3A54493/solR/1/page/1/nbResultPerPage/200/tri/valid/filter/valid/category/%2A

    - json :
      http://api.archives-ouvertes.fr/ref/structure/?q=parentDocid_i:54493&fq=valid_s:VALID
