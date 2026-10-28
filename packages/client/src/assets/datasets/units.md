EC2U research units and facilities are described using a controlled subset of
the [W3C Organization Ontology](../about/vocabularies/org.md) data model, extended
with [Dublin Core](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) properties.

| prefix | namespace                   | description                   |
|--------|-----------------------------|-------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/ | EC2U Knowledge Hub vocabulary |
| org:   | http://www.w3.org/ns/org#   | [The Organization Ontology]   |
| dct:   | http://purl.org/dc/terms/   | [Dublin Core] [DCMI Terms]    |

![research unit data model](index/units.svg)

# Unit

| term          | type                                          | # | definition                                                                         |
|---------------|-----------------------------------------------|---|------------------------------------------------------------------------------------|
| **ec2u:Unit** | [ec2u:Organization], [org:OrganizationalUnit] |   | a [university] organizational unit involved with or supporting research activities |
| [dct:subject] | [ec2u:Topic]                                  | * | links to related research topics in the [EuroSciVoc] taxonomy                      |
| [org:unitOf]  | [ec2u:Organization]                           | * | links to organizations this units belongs to                                       |

[The Organization Ontology]: https://www.w3.org/TR/vocab-org/

[Dublin Core]: https://www.dublincore.org

[DCMI Terms]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/

[ec2u:Organization]: organizations.md#organization

[org:OrganizationalUnit]: ../about/vocabularies/org.md#organizational-unit

[university]: universities.md#university

[dct:subject]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/subject

[ec2u:Topic]: taxonomies.md#topic

[EuroSciVoc]: /taxonomies/euroscivoc/

[org:unitOf]: https://www.w3.org/TR/vocab-org/#org:unitOf
