EC2U persons are described using a controlled subset of
the  [FOAF](../handbooks/vocabularies/foaf.md) data model.

| prefix | namespace                   | description                                                         |
|--------|-----------------------------|---------------------------------------------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/ | EC2U Knowledge Hub vocabulary                                       |
| foaf:  | http://xmlns.com/foaf/0.1/  | [Friend of a Friend (FOAF)](http://xmlns.com/foaf/spec/) vocabulary |

![person data model](index/persons.svg#50)

# Person

| term                                                                          | type                                                                                          | # | description                                      |
|-------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|---|--------------------------------------------------|
| **ec2u:Person**                                                               | [ec2u:Resource](./index.md#resource), [foaf:Person](../handbooks/vocabularies/foaf.md#person) |   | EC2U Knowledge Hub person                        |
| ‹headOf› = ^[org:hasHead](https://www.w3.org/TR/vocab-org/#org:hasHead)       | [ec2u:Organization](organizations.md#organization)                                            | * | links to organizations headed by the person      |
| ‹memberOf› = ^[org:hasMember](https://www.w3.org/TR/vocab-org/#org:hasMember) | [ec2u:Organization](organizations.md#organization)                                            | * | links to organizations the person is a member of |
