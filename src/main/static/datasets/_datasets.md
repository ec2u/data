# Data Model

EC2U datasets are described using a controlled subset of
the [VoID](https://www.w3.org/TR/void/), [Dublin Core](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/)
and [RDFS](https://www.w3.org/TR/rdf11-schema/) data models, as outlined by
the [Describing Linked Datasets with the VoID Vocabulary](https://www.w3.org/TR/void/) W3C Internet Group Note.

| prefix | namespace                             | definition                                                                                                                |
|--------|---------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| dct:   | http://purl.org/dc/terms/             | [Dublin Core](https://www.dublincore.org) [DCMI Terms](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) |
| rdfs:  | http://www.w3.org/2000/01/rdf-schema# | [RDF Schema 1.1 (RDFS)](https://www.w3.org/TR/rdf11-schema/)                                                              |
| void:  | http://rdfs.org/ns/void#              | [Vocabulary of Interlinked Datasets (VoID)](http://vocab.deri.ie/void)                                                    |
| ec2u:  | https://data.ec2u.eu/terms/           | EC2U Knowledge Hub vocabulary                                                                                             |

![dataset data model](index/datasets.svg#50)

## Dataset {#dataset}

| term                                                     | type                      | # | description                            |
|----------------------------------------------------------|---------------------------|---|----------------------------------------|
| **ec2u:Dataset**                                         | [Collection](#collection) |   | EC2U Knowledge Hub dataset             |
| [ec2u:collection](https://data.ec2u.eu/terms/collection) | Collection                | 1 | The collection this dataset belongs to |

## Collection {#collection}

| term                                                                  | type                                      | #    | description                                                                           |
|-----------------------------------------------------------------------|-------------------------------------------|------|---------------------------------------------------------------------------------------|
| **ec2u:Collection**                                                   | [Resource](resources.md#resource)         |      | Collection of resources                                                               |
| [dct:title](http://purl.org/dc/terms/title)                           | text                                      | 1    | Main title of the collection                                                          |
| [dct:alternative](http://purl.org/dc/terms/alternative)               | text                                      | 0..1 | Alternative title of the collection                                                   |
| [dct:description](http://purl.org/dc/terms/description)               | text                                      | 0..1 | Description of the collection                                                         |
| [dct:created](http://purl.org/dc/terms/created)                       | date                                      | 0..1 | Date of creation                                                                      |
| [dct:issued](http://purl.org/dc/terms/issued)                         | date                                      | 0..1 | Date of formal issuance                                                               |
| [dct:modified](http://purl.org/dc/terms/modified)                     | date                                      | 0..1 | Date of last modification                                                             |
| [dct:publisher](http://purl.org/dc/terms/publisher)                   | [OrgOrganization](agents.md#organization) | 0..1 | Entity responsible for making the collection available                                |
| [dct:source](http://purl.org/dc/terms/source)                         | Reference                                 | 0..1 | Related resource from which the collection is derived                                 |
| [dct:rights](http://purl.org/dc/terms/rights)                         | string                                    | 0..1 | Information about rights held in and over the collection                              |
| [dct:license](http://purl.org/dc/terms/license)                       | Reference                                 | *    | Legal document giving official permission to do something with the collection         |
| [dct:accessRights](http://purl.org/dc/terms/accessRights)             | text                                      | 0..1 | Information about who can access the resource or an indication of its security status |
| [dct:subject](http://purl.org/dc/terms/subject)                       | [Topic](taxonomies.md#concept)            | *    | The topics of the collection                                                          |
| ‹members› = ^[ec2u:collection](https://data.ec2u.eu/terms/collection) | [Resource](resources.md#resource)         | *    | Resources belonging to this collection                                                |

> [!WARNING]
> Only datasets with a defined issuance date defined by the `dct:issued` property are exposed through user facing search
> interfaces.

# Licensing

Individual datasets included in the catalog are licensed by their respective publishers under the licensing terms
specified by the [`dct:rights`](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_rights), [
`dct:license `](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_license) and  [
`dct:accessRights`](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_access_rights) properties.

> [!WARNING]
> The licensing terms defined by the `dct:license` property apply to the dataset as a whole: individual entries in the
> dataset may define their own licensing terms.

# Sources

* static content from application source code
* manually curated database content

## Updating

* static content is updated on demand by manually editing application source code