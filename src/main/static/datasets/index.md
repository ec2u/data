EC2U datasets are described using a controlled subset
of
the [Dublin Core Terms](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/), [RDF Schema 1.1 (RDFS)](https://www.w3.org/TR/rdf11-schema/)
and [WGS84 Geo Positioning](http://www.w3.org/2003/01/geo/wgs84_pos#) data models,
extended with some internal
housekeeping properties.

| prefix | namespace                                | description                                                                                                               |
|--------|------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/              | EC2U Knowledge Hub vocabulary                                                                                             |
| dct:   | http://purl.org/dc/terms/                | [Dublin Core](https://www.dublincore.org) [DCMI Terms](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) |
| rdfs:  | http://www.w3.org/2000/01/rdf-schema#    | [RDF Schema 1.1 (RDFS)](https://www.w3.org/TR/rdf11-schema/) vocabulary                                                   |
| geo:   | http://www.w3.org/2003/01/geo/wgs84_pos# | [WGS84 Geo Positioning](http://www.w3.org/2003/01/geo/wgs84_pos#) vocabulary                                              |
| void:  | http://rdfs.org/ns/void#                 | [Vocabulary of Interlinked Datasets (VoID)](https://www.w3.org/TR/void/) vocabulary                                       |

![dataset data model](index/datasets.svg#75)

# Reference

| term                                                                 | type                  | #    | definition                                                                                                                                 |
|----------------------------------------------------------------------|-----------------------|------|--------------------------------------------------------------------------------------------------------------------------------------------|
| ***Reference***                                                      |                       |      | Generic reference to an entity                                                                                                             |
| id                                                                   | uri                   | 1    | unique entity identifier                                                                                                                   |
| [rdfs:label](https://www.w3.org/TR/rdf-schema/#ch_label)             | text {maxLength(100)} | 1    | human readable label for the entity; should uniquely identify the entity even out of context and optimally not exceed 50 characters        |
| [rdfs:comment](https://www.w3.org/TR/rdf-schema/#ch_comment)         | text {maxLength(500)} | *    | human readable description of the entity ; should uniquely describe the entity even out of context and optimally not exceed 500 characters |
| [rdfs:isDefinedBy](https://www.w3.org/TR/rdf-schema/#ch_isdefinedby) | uri                   | 0..1 | link to a human or machine-readable specification providing a formal definition of the entity or its data model                            |
| [rdfs:seeAlso](https://www.w3.org/TR/rdf-schema/#ch_seealso)         | uri                   | *    | links to other entities describing the same subject                                                                                        |

# Geo Reference

| term                                                     | type                      | # | definition                                   |
|----------------------------------------------------------|---------------------------|---|----------------------------------------------|
| ***GeoReference***                                       | [*Reference*](#reference) |   | Geographic reference with WGS84 coordinates  |
| [geo:lat](http://www.w3.org/2003/01/geo/wgs84_pos#lat)   | double                    | 1 | the WGS84 latitude of the referenced entity  |
| [geo:long](http://www.w3.org/2003/01/geo/wgs84_pos#long) | double                    | 1 | the WGS84 longitude of the referenced entity |

# Resource

> [!WARNING]
> The `ec2u:Resource` data model is not intended to be used in isolation but only to provide base
> definitions factoring generic properties shared by the specialised [models](../handbooks/index.md#data-models) defined
> by each dataset.

| term              | type                               | #    | definition                                                                                                                               |
|-------------------|------------------------------------|------|------------------------------------------------------------------------------------------------------------------------------------------|
| **ec2u:Resource** | [*Reference*](#reference)          |      | A resource included in the EC2U Knowledge Hub                                                                                            |
| ec2u:dataset      | [ec2u:Dataset](#dataset)           | 1    | link to the EC2U Knowledge Hub dataset the resource belongs to                                                                           |
| ec2u:university   | [ec2u:University](universities.md) | 0..1 | link to a EC2U partner university associated with the resource                                                                           |
| ec2u:generated    | boolean                            | 1    | `true` if the resource description was even partially  generated by means of automated AI-based analysis; `false` or undefined otherwise |
| ec2u:version      | string                             | 0..1 | version identifier for the resource                                                                                                      |

> [!NOTE]
>
> Human-readable labels and descriptions are localised either in English or in one of the local EC2U partner
> university languages.

# Dataset

> [!WARNING]
> The `ec2u:Dataset` data model is not intended to be used in isolation but only to provide base
> definitions factoring generic properties shared by the specialised [models](../handbooks/index.md#data-models) defined
> by each dataset.

| term                                                                                                     | type                                               | #    | definition                                      |
|----------------------------------------------------------------------------------------------------------|----------------------------------------------------|------|-------------------------------------------------|
| **ec2u:Dataset**                                                                                         | [ec2u:Resource](#resource)                         |      | EC2U Knowledge Hub dataset                      |
| [dct:title](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/title/)               | text                                               | 1    | the title of the dataset                        |
| [dct:alternative](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/alternative/)   | text                                               | *    | alternative titles of the dataset               |
| [dct:description](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/description/)   | text                                               | *    | the description of the dataset                  |
| [dct:created](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/created/)           | date                                               | 0..1 | the dataset creation date                       |
| [dct:issued](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/issued/)             | date                                               | 0..1 | the formal issuance date of the dataset         |
| [dct:modified](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/modified/)         | date                                               | 0..1 | the latest modification date of the dataset     |
| [dct:publisher](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/publisher/)       | [ec2u:Organization](organizations.md#organization) | 0..1 | link to the organization publishing the dataset |
| [dct:source](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/source/)             | [*Reference*](#reference)                          | 0..1 | link to the source of the dataset               |
| [dct:rights](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/rights/)             | text                                               | 0..1 | the rights information for the dataset          |
| [dct:license](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/license/)           | [*Reference*](#reference)                          | *    | links to the licensing terms of the dataset     |
| [dct:accessRights](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/accessRights/) | text                                               | *    | the access rights for the dataset               |
| [dct:subject](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/subject/)           | [ec2u:Topic](taxonomies.md#topic)                  | *    | links to topics that classify the dataset       |
| [rdfs:member](https://www.w3.org/TR/rdf-schema/#ch_member)                                               | [ec2u:Resource](#resource)                         | *    | links to resources that belong to the dataset   |
