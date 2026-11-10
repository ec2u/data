EC2U research units and facilities are described using a controlled subset of
the [W3C Organization Ontology](../vocabularies/org.md) data model, extended
with [Dublin Core](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) properties.

| prefix | namespace                   | description                      |
|--------|-----------------------------|----------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/ | EC2U Knowledge Hub vocabulary    |
| org:   | http://www.w3.org/ns/org#   | [The Organization Ontology]      |
| dct:   | http://purl.org/dc/terms/   | [Dublin Core] [DCMI Terms]       |
| dcat:  | http://www.w3.org/ns/dcat#  | [Data Catalog Vocabulary (DCAT)] |

![research unit data model](index/units.svg)

# Unit

| term           | type                                          | #    | definition                                                               |
|----------------|-----------------------------------------------|------|--------------------------------------------------------------------------|
| **ec2u:Unit**  | [ec2u:Organization], [org:OrganizationalUnit] |      | a research unit or supporting structure at an EC2U [university]          |
| [dct:subject]  | [ec2u:Topic]                                  | *    | research topics the unit is concerned with, in the [EuroSciVoc] taxonomy |
| [dcat:keyword] | text                                          | *    | free-text terms characterising the activities of the unit                |
| [org:unitOf]   | [ec2u:Organization]                           | 1..* | organizations the unit belongs to                                        |

[The Organization Ontology]: https://www.w3.org/TR/vocab-org/

[Dublin Core]: https://www.dublincore.org

[DCMI Terms]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/

[Data Catalog Vocabulary (DCAT)]: https://www.w3.org/TR/vocab-dcat-3/

[ec2u:Organization]: organizations.md#organization

[org:OrganizationalUnit]: ../vocabularies/org.md#organizational-unit

[university]: universities.md#university

[dct:subject]: https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/subject

[ec2u:Topic]: taxonomies.md#topic

[EuroSciVoc]: /taxonomies/euroscivoc/

[dcat:keyword]: https://www.w3.org/TR/vocab-dcat-3/#Property:resource_keyword

[org:unitOf]: https://www.w3.org/TR/vocab-org/#org:unitOf
