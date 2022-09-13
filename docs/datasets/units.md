---
title: Research Units
---

The [EC2U Research Units Dataset](http://data.ec2u.eu/units/) …

*Searchable database on the existing R&I activities and facilities among the EC2U Alliance*

*WP4 will provide a searchable database on the existing R&I activities and facilities among the EC2U Alliance by using
research and semantic searches on the data provided by the seven universities, possibly through micro-data annotations on
their public web sites. This database will support the activities of WP2 (Task 2.1, Definition of a common EC2U R&I
agenda, Univ Salamanca), and in particular of the Virtual Institutes. It will also support Task 1.2 (Shared
transformation – on the legal status of the Alliances – Univ Poitiers).*

# Model

![research units data model](index/units.svg)

EC2U research units and facilities are described using a controlled subset of
the [Organization Ontology](https://www.w3.org/TR/vocab-org/) data model, extended with:

* [SKOS](https://www.w3.org/TR/skos-primer/#seclabel) labels, as per *Organization Ontology* recommendations

## ec2u:Unit

| property                                     | description          |
| -------------------------------------------- | -------------------- |
| all [ec2u:Resource](resources.md) properties | inherited properties |
| org:identifier                               |                      |
| skos:prefLabel                               |                      |
| skos:altLabel                                |                      |
| org:unitOf                                   |                      |
| org:hasUnit                                  |                      |
| org:hasMember                                |                      |

## ec2u:University

| property    | description |
| ----------- | ----------- |
| org:hasUnit |             |

## ec2u:Person

| property     | description |
| ------------ | ----------- |
| org:headOf   |             |
| org:memberOf |             |

# Licensing

> ❗️ To be confirmed.

[EC2U Catalog Dataset ](https://data.ec2u.eu/)© 2022 by [EC2U Alliance ](https://www.ec2u.eu/)is licensed
under [Attribution-NonCommercial-NoDerivatives 4.0 International](http://creativecommons.org/licenses/by-nc-nd/4.0/?ref=chooser-v1)

# Sources

> ❗️TBC

# Updating

> ❗️TBC