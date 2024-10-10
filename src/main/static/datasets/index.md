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
| rdfs:  | http://www.w3.org/2000/01/rdf-schema# | [RDF Schema 1.1 (RDFS)](https://www.w3.org/TR/rdf11-schema/)                                                              |
| void:  | http://rdfs.org/ns/void#              | [Vocabulary of Interlinked Datasets (VoID)](http://vocab.deri.ie/void)                                                    |

![dataset data model](index/datasets.svg#50)

## Dataset

| term                                                                 | type                                   | #    | description                                                                                                                                               |
|----------------------------------------------------------------------|----------------------------------------|------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **[void:Dataset](https://www.w3.org/TR/void/#dataset)**              | [ec2u:Asset](assets.md)                |      | EC2U Knowledge Hub dataset                                                                                                                                |
| [void:rootResource](https://www.w3.org/TR/void/#root-resource)       | [rdfs:Resource](resources.md)          | *    | links to dataset entry points; may be an [rdfs:Class](https://www.w3.org/TR/rdf-schema/#ch_class)                                                         |
| [void:entities](https://www.w3.org/TR/void/#statistics)              | integer                                | 0..1 | count of the principal entities in the dataset; if `void:rootEntity` is an `rdfs:Class`, the count refers to the resources that are instance of the class |
| [rdfs:isDefinedBy](https://www.w3.org/TR/rdf-schema/#ch_isdefinedby) | [rdfs:Resource](resources.md)          | 0..1 | link to the data model specification                                                                                                                      |
| [rdfs:member](https://www.w3.org/TR/rdf-schema/#ch_member)           | [rdfs:Resource](resources.md#resource) | *    | links to the EC2U Knowledge Hub resources included in the dataset                                                                                         |

> **⚠️**  Only datasets with a defined issuance date defined by the `dct:issued` property are exposed through user
> facing search interfaces.

# Licensing

Individual datasets included in the catalog are licensed by their respective publishers under the licensing terms
specified by
the [`dct:rights`](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_rights), [`dct:license `](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_license)
and  [`dct:accessRights`](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_access_rights) properties as described
in the [asset](assets.md) data model.

> **⚠️** The licensing terms defined by the `dct:license` property apply to the dataset as a whole: individual entries
> in the dataset may define their own licensing terms.

# Sources

* static content from application source code
* manually curated database content

## Updating

* static content is updated on demand by manually editing application source code
