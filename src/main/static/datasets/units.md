# Data Model

EC2U research units and facilities are described using a controlled subset of
the [Organization Ontology](https://www.w3.org/TR/vocab-org/) data model, extended
with [Dublin Core](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) properties.

| prefix | namespace                   | description                                                  |
| ------ | --------------------------- | ------------------------------------------------------------ |
| ec2u:  | https://data.ec2u.eu/terms/ | EC2U Knowledge Hub vocabulary                                |
| dct:   | http://purl.org/dc/terms/   | [Dublin Core](https://www.dublincore.org) [DCMI Terms](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) |
| org:   | http://www.w3.org/ns/org#   | [The Organization Ontology](https://www.w3.org/TR/vocab-org/) |

![research unit data model](index/units.svg#75)

## Unit

| term                                                                                                              | type                                                 | # | definition                                                                                          |
|-------------------------------------------------------------------------------------------------------------------|------------------------------------------------------|---|-----------------------------------------------------------------------------------------------------|
| **ec2u:Unit**                                                                                                     | [org:FormalOrganization](agents#formal-organization) |   | a [university](universities.md) organizational unit involved with or supporting research activities |
| [org:classification](https://www.w3.org/TR/vocab-org/#org:classification)                                         | [skos:Concept](concepts.md#concept)                  | * | links to organization types in the [EC2U Organization Types](/concepts/organizations) taxonomy      |
| [dct:subject](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/subject) | [skos:Concept](concepts.md#concept)                  | * | links to related research topics in the [EuroSciVoc](/concepts/euroscivoc) taxonomy                 |

