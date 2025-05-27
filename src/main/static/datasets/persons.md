EC2U persons are described using a controlled subset of
the [W3C Organization Ontology](../handbooks/vocabularies/org.md) and  [FOAF](../handbooks/vocabularies/foaf.md) data
models.

| prefix | namespace                   | description                                                         |
|--------|-----------------------------|---------------------------------------------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/ | EC2U Knowledge Hub vocabulary                                       |
| org:   | http://www.w3.org/ns/org#   | [The Organization Ontology](https://www.w3.org/TR/vocab-org/)       |
| foaf:  | http://xmlns.com/foaf/0.1/  | [Friend of a Friend (FOAF)](http://xmlns.com/foaf/spec/) vocabulary |

![person data model](index/persons.svg#50)

# Person

| term                                                          | type                                                                                          | # | description                                      |
|---------------------------------------------------------------|-----------------------------------------------------------------------------------------------|---|--------------------------------------------------|
| **ec2u:Person**                                               | [ec2u:Resource](./index.md#resource), [foaf:Person](../handbooks/vocabularies/foaf.md#person) |   | EC2U Knowledge Hub person                        |
| [org:headOf](https://www.w3.org/TR/vocab-org/#org:headOf)     | [ec2u:Organization](organizations.md#organization)                                            | * | links to organisations headed by the person      |
| [org:memberOf](https://www.w3.org/TR/vocab-org/#org:memberOf) | [ec2u:Organization](organizations.md#organization)                                            | * | links to organisations the person is a member of |
