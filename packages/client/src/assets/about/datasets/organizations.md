EC2U organizations are described using a controlled subset of
the  [W3C Organization Ontology](../vocabularies/org.md) and [Schema.org](../vocabularies/schema.md)
data models.

| prefix  | namespace                   | description                   |
|---------|-----------------------------|-------------------------------|
| ec2u:   | https://data.ec2u.eu/terms/ | EC2U Knowledge Hub vocabulary |
| org:    | http://www.w3.org/ns/org#   | [The Organization Ontology]   |
| schema: | https://schema.org/         | [Schema.org] vocabulary       |

![organization data model](index/organizations.svg)

# Organization

| term                     | type                                                       | # | description                                                                        |
|--------------------------|------------------------------------------------------------|---|------------------------------------------------------------------------------------|
| **ec2u:Organization**    | [ec2u:Resource], [org:Organization], [schema:Organization] |   | An organisation related to EC2U partner universities                               |
| [org:classification]     | [ec2u:Topic]                                               | * | categories classifying the organization, in the [EC2U Organization Types] taxonomy |
| [org:subOrganizationOf]  | [ec2u:Organization]                                        | * | organizations the organization is part of                                          |
| [org:hasSubOrganization] | [ec2u:Organization]                                        | * | organizations that are part of the organization                                    |
| [org:hasUnit]            | [ec2u:Unit]                                                | * | organizational units belonging to the organization                                 |
| [org:hasHead]            | [ec2u:Person]                                              | * | persons leading the organization                                                   |
| [org:hasMember]          | [ec2u:Person]                                              | * | persons who are members of the organization                                        |

[The Organization Ontology]: https://www.w3.org/TR/vocab-org/

[Schema.org]: https://schema.org/

[ec2u:Resource]: ./index.md#resource

[org:Organization]: ../vocabularies/org.md#organization

[schema:Organization]: ../vocabularies/schema.md#organization

[org:classification]: https://www.w3.org/TR/vocab-org/#org:classification

[ec2u:Topic]: taxonomies.md#topic

[EC2U Organization Types]: /taxonomies/organizations/

[org:subOrganizationOf]: https://www.w3.org/TR/vocab-org/#org:subOrganizationOf

[ec2u:Organization]: #organization

[org:hasSubOrganization]: https://www.w3.org/TR/vocab-org/#org:hasSubOrganization

[org:hasUnit]: https://www.w3.org/TR/vocab-org/#org:hasUnit

[ec2u:Unit]: units.md#unit

[org:hasHead]: https://www.w3.org/TR/vocab-org/#org:hasHead

[ec2u:Person]: persons.md#person

[org:hasMember]: https://www.w3.org/TR/vocab-org/#org:hasMember
