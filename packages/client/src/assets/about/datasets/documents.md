EC2U documents are described using a controlled subset of
the [Dublin Core](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/)
data model, extended with some [schema.org](https://schema.org/) properties.

| prefix  | namespace                   | definition                    |
|---------|-----------------------------|-------------------------------|
| ec2u:   | https://data.ec2u.eu/terms/ | EC2U Knowledge Hub vocabulary |
| dct:    | http://purl.org/dc/terms/   | [Dublin Core] [DCMI Terms]    |
| schema: | https://schema.org/         | [Schema.org] vocabulary       |

![documents data model](index/documents.svg)

# Document

| term               | type                | #    | description                                                                                       |
|--------------------|---------------------|------|---------------------------------------------------------------------------------------------------|
| **ec2u:Document**  | [ec2u:Resource]     |      | A regulation, policy or other governance document shared by an EC2U university                    |
| [schema:url]       | uri                 | *    | web addresses of the online versions of the document                                              |
| [dct:identifier]   | text                | 0..1 | the formal identifier assigned to the document by its publisher                                   |
| [dct:language]     | tag                 | *    | languages the document is written in                                                              |
| [dct:title]        | text                | 1    | the official title of the document                                                                |
| [dct:description]  | text                | 0..1 | the summary of the content of the document                                                        |
| [dct:creator]      | [ec2u:Person]       | 0..1 | the person primarily responsible for the content of the document                                  |
| [dct:contributor]  | [ec2u:Person]       | *    | other persons who contributed to the content of the document                                      |
| [dct:publisher]    | [ec2u:Organization] | 0..1 | the organization responsible for issuing the document                                             |
| [dct:created]      | date                | 0..1 | the date of creation of the document                                                              |
| [dct:issued]       | date                | 0..1 | the date of formal issuance of the document                                                       |
| [dct:modified]     | date                | 0..1 | the date of the latest modification of the document                                               |
| [dct:valid]        | text                | 0..1 | the period during which the document is in force                                                  |
| [dct:rights]       | text                | 0..1 | the statement of the copyright held over the document                                             |
| [dct:accessRights] | text                | 0..1 | the statement of who may access the document and under which conditions                           |
| [dct:license]      | [*Reference*]       | 0..1 | the legal document granting permission to use the document                                        |
| [dct:type]         | [ec2u:Topic]        | *    | categories of governance document the document falls under, in the [EC2U Document Types] taxonomy |
| [dct:subject]      | [ec2u:Topic]        | *    | topics the document is about, in the [EuroSciVoc] taxonomy                                        |
| [dct:audience]     | [ec2u:Topic]        | *    | stakeholder groups the document is intended for, in the [EC2U Stakeholders] taxonomy              |
| [dct:relation]     | [ec2u:Document]     | *    | other documents the document is related to                                                        |

[Dublin Core]: https://www.dublincore.org

[DCMI Terms]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/

[Schema.org]: https://schema.org/

[ec2u:Resource]: ./index.md#resource

[schema:url]: https://schema.org/url

[dct:identifier]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/identifier/

[dct:language]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/language/

[dct:title]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/title/

[dct:description]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/description/

[dct:creator]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/creator/

[ec2u:Person]: persons.md#person

[dct:contributor]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/contributor/

[dct:publisher]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/publisher/

[ec2u:Organization]: organizations.md#organization

[dct:created]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/created/

[dct:issued]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/issued/

[dct:modified]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/modified/

[dct:valid]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/valid/

[dct:rights]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/rights/

[dct:accessRights]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/accessRights

[dct:license]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/license/

[*Reference*]: ./index.md#reference

[dct:type]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/type/

[ec2u:Topic]: taxonomies.md#topic

[EC2U Document Types]: /taxonomies/documents/

[dct:subject]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/subject/

[EuroSciVoc]: /taxonomies/euroscivoc/

[dct:audience]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/audience/

[EC2U Stakeholders]: /taxonomies/stakeholders/

[dct:relation]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/terms/relation/

[ec2u:Document]: #document
