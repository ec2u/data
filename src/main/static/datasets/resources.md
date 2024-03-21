> ⚠️ Work in progress…

The resource data model is *abstract*, that is is not intended to be used in isolation but only to provide a base definition factoring generic properties shared by the specialized models defined by each [dataset](./index.md).

# Data Model

![resource data model](index/resources.svg)

EC2U resources are described using a controlled subset of
the [Dublin Core](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) data model.

All generic human-readable labels and descriptions are localized either in English or in one of the local EC2U partner
languages.

| prefix | namespace                                   | description                                                                                                    |
|--------|---------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/                 | EC2U Knowledge Hub vocabulary                                                                                  |
| dct:   | http://purl.org/dc/terms/                   |                                                                                                                |
| rdf:   | http://www.w3.org/1999/02/22-rdf-syntax-ns# | [Resource Description Framework 1.1 (RDF)](https://www.w3.org/TR/2014/REC-rdf11-concepts-20140225/) vocabulary |
| rdfs:  | http://www.w3.org/2000/01/rdf-schema#       | [RDF Schema 1.1 (RDFS)](https://www.w3.org/TR/rdf11-schema/) vocabulary                                        |
| skos:  | http://www.w3.org/2004/02/skos/core#        | [Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-reference/) vocabulary                |

## Entities

| term              | type                        | #    | description                                                                                                                              |
|-------------------|-----------------------------|------|------------------------------------------------------------------------------------------------------------------------------------------|
| ***ec2u:Entity*** | rdfs:Resource               |      | A Knowledge Hub entity.                                                                                                                  |
| rdfs:label        | text<br />{maxLength(100)}  | 1    | a human readable label for the entity; should uniquely identify the entity even out of context and optimally not exceed 50 characters    |
| rdfs:comment      | text<br />{maxLength(1000)} | 0..1 | a human readable label for the resource; should uniquely identify the entity even out of context and optimally not exceed 250 characters |

## Resources

An entity included in one of the EC2U Knowledge Hub datasets.

| term                                                                                                   | type | #    | description                                                                                                                               |
|--------------------------------------------------------------------------------------------------------|------|------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `@id`                                                                                                  |      |      |                                                                                                                                           |
| [rdf:type](https://www.w3.org/TR/rdf-schema/#ch_type)                                                  | id   | 1..* | a link to the RDF classes the resource belongs to                                                                                         |
| [dct:title](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/title/)             |      |      | the human-readable, localized name of the resource                                                                                        |
| [dct:description](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/description/) |      |      | a human-readable, localized description of the resource                                                                                   |
| [dct:publisher](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/publisher/)     |      |      | a link to the entity responsible for making the resource available                                                                        |
| [dct:source](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/source/)           |      |      | a link to a related resource from which the described resource is derived                                                                 |
| [dct:issued](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/issued/)           |      |      | the date of formal issuance of the resource                                                                                               |
| [dct:created](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/created/)         |      |      | the date of creation of the resource                                                                                                      |
| [dct:modified](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/modified/)       |      |      | the latest date on which the resource was changed                                                                                         |
| [dct:type](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/type/)               |      |      | a link to a classification for the resource; must reference one the SKOS concepts managed by the *Knowledge Hub*                          |
| [dct:subject](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/subject/)         |      |      | a link to a topic for the resource; must reference one the SKOS [concepts](https://data.ec2u.eu/concepts/) managed by the *Knowledge Hub* |
| ec2u:university                                                                                        |      |      | a link to an EC2U partner [university](universities.md) associated with the resource                                                      |

> ❓Replace `ec2u:university` with `dct:coverage` ?
>
> ❓Convert `ec2u:Coverage` to concept scheme?

