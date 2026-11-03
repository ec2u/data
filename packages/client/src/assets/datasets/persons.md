EC2U persons are described using a controlled subset of the [W3C Organization Ontology](../about/vocabularies/org.md)
and  [FOAF](../about/vocabularies/foaf.md) data models.

| prefix | namespace                   | description                            |
|--------|-----------------------------|----------------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/ | EC2U Knowledge Hub vocabulary          |
| org:   | http://www.w3.org/ns/org#   | [The Organization Ontology]            |
| foaf:  | http://xmlns.com/foaf/0.1/  | [Friend of a Friend (FOAF)] vocabulary |

![person data model](index/persons.svg#50)

# Person

| term                      | type                           | # | description                                                                               |
|---------------------------|--------------------------------|---|-------------------------------------------------------------------------------------------|
| **ec2u:Person**           | [ec2u:Resource], [foaf:Person] |   | A staff member involved in teaching and research activities at an EC2U partner university |
| ‹headOf› = ^[org:hasHead] | [ec2u:Organization]            | * | organizations headed by the person                                                        |
| [org:memberOf]            | [ec2u:Organization]            | * | organizations the person is a member of                                                   |

[The Organization Ontology]: https://www.w3.org/TR/vocab-org/

[Friend of a Friend (FOAF)]: http://xmlns.com/foaf/spec/

[ec2u:Resource]: ./index.md#resource

[foaf:Person]: ../about/vocabularies/foaf.md#person

[org:hasHead]: https://www.w3.org/TR/vocab-org/#org:hasHead

[org:memberOf]: https://www.w3.org/TR/vocab-org/#org:memberOf

[ec2u:Organization]: organizations.md#organization
