---
title: Universities
---

![universities data model](index/universities.svg)

# Vocabularies

EC2U partner universities are described using a controlled subset of
the [Organization Ontology](https://www.w3.org/TR/vocab-org/) data model, extended with:

* [SKOS](https://www.w3.org/TR/skos-primer/#seclabel) labels, as per *Organization Ontology* recommendations
* the following internal specialized properties

| property     | datatype     | definition                                                   |
| ------------ | ------------ | ------------------------------------------------------------ |
| `ec2u:schac` | `xsd:string` | the [SCHAC code](https://wiki.uni-foundation.eu/pages/viewpage.action?pageId=12746935) of the institution |
| `ec2u:image` | `xsd:anyURI` | the URL of a generic outdoor image                           |

