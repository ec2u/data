Catalog entries include human and machine-readable dataset descriptions and basic information about
license and access rights for partners and other stakeholders.

External supporting datasets may also be listed in the catalog for reference and ease of access.

# Data Model

EC2U datasets are described using a controlled subset
of
the [VoID](https://www.w3.org/TR/void/) , [Dublin Core](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/)
and [RDFS](https://www.w3.org/TR/rdf11-schema/) data models, as outlined by
the [Describing Linked Datasets with the VoID Vocabulary](https://www.w3.org/TR/void/) W3C Internet Group Note.

| prefix | namespace                             | definition                                                                                                                |
|--------|---------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| dct:   | http://purl.org/dc/terms/             | [Dublin Core](https://www.dublincore.org) [DCMI Terms](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) |
| rdfs:  | http://www.w3.org/2000/01/rdf-schema# | [RDF Schema 1.1 (RDFS)](https://www.w3.org/TR/rdf11-schema/) vocabulary                                                   |
| void:  | http://rdfs.org/ns/void#              | [Vocabulary of Interlinked Datasets (VoID)](http://vocab.deri.ie/void)                                                    |

![dataset data model](index/datasets.svg#75)

## Dataset

| term                                                                                                                  | type                                   | #    | description                                                                                                                                               |
|-----------------------------------------------------------------------------------------------------------------------|----------------------------------------|------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **[void:Dataset](https://www.w3.org/TR/void/#dataset)**                                                               | [rdfs:Resource](resources.md)          |      | EC2U Knowledge Hub dataset                                                                                                                                |
| [dct:title](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/title/)                            | text                                   | 1    | complete name                                                                                                                                             |
| [dct:alternative](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/alternative/)                | text                                   | 0..1 | shortened / informal name                                                                                                                                 |
| [dct:description](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/description/)                | text                                   | 0..1 | content and intended usage description                                                                                                                    |
| [dct:publisher](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/publisher) | [org:Organization](agents.md)          | 0..1 | link to the organisation responsible for publishing the dates                                                                                             |
| [dct:source](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/source)       | [rdfs:Resource](resources.md)          | 0..1 | link to a third-party asset the dataset was derived from                                                                                                  |
| [dct:created](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/created/)                        | date                                   | 0..1 | creation date                                                                                                                                             |
| [dct:issued](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/issued/)                          | date {≥ dct:created}                   | 0..1 | formal issuance date; only datasets with a defined issuance date are exposed through user facing search interfaces                                        |
| [dct:modified](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/modified/)                      | date {≥ dct:created}                   | 0..1 | latest modification date                                                                                                                                  |
| [dct:rights](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_rights)                                            | string                                 | 1    | copyright statement (for instance, `Copyright © 2022 EC2U Alliance`)                                                                                      |
| [dct:accessRights](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_access_rights)                               | text                                   | 0..1 | human-readable, localised description of access rights and policies for partners and other stakeholders                                                   |
| [dct:license](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_license)                                          | [rdfs:Resource](resources.md)          | *    | links to the public text of the licensing terms for the dataset as a whole; entries in the dataset may define their own licensing terms                   |
| [void:rootResource](https://www.w3.org/TR/void/#root-resource)                                                        | [rdfs:Resource](resources.md)          | *    | links to dataset entry points; may be an [rdfs:Class](https://www.w3.org/TR/rdf-schema/#ch_class)                                                         |
| [void:entities](https://www.w3.org/TR/void/#statistics)                                                               | integer                                | 0..1 | count of the principal entities in the dataset; if `void:rootEntity` is an `rdfs:Class`, the count refers to the resources that are instance of the class |
| [void:subset](https://www.w3.org/TR/void/#subset)                                                                     | [void:Dataset](#dataset)               | *    | link to a dataset partition                                                                                                                               |
| [rdfs:isDefinedBy](https://www.w3.org/TR/rdf-schema/#ch_isdefinedby)                                                  | [rdfs:Resource](resources.md)          | 0..1 | link to the data model specification                                                                                                                      |
| [rdfs:member](https://www.w3.org/TR/rdf-schema/#ch_member)                                                            | [rdfs:Resource](resources.md#resource) | *    | links to the EC2U Knowledge Hub resources included in the dataset                                                                                         |

> **⚠️** Published datasets, that is, datasets that specify a `dct:issued` date, must also include at least
> one `dct:license`.

# Licensing

Individual datasets included in the catalog are licensed by their respective publishers under the licensing terms
specified by
the [`dct:rights`](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_rights), [`dct:license `](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_license)
and  [`dct:accessRights`](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_access_rights) properties as described
above.

# Sources

* static content from application source code
* manually curated database content

## Updating

* static content is updated on demand by manually editing application source code
