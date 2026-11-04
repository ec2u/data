EC2U allied universities are described using a controlled subset of
the [W3C Organization Ontology](../vocabularies/org.md) data model, extended with some specialised properties.

| prefix | namespace                            | description                                              |
|--------|--------------------------------------|----------------------------------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/          | EC2U Knowledge Hub vocabulary                            |
| foaf:  | http://xmlns.com/foaf/0.1/           | [Friend of a Friend (FOAF)] vocabulary                   |
| org:   | http://www.w3.org/ns/org#            | [The Organization Ontology]                              |
| skos:  | http://www.w3.org/2004/02/skos/core# | [Simple Knowledge Organization System (SKOS)] vocabulary |

![university data model](index/universities.svg)

# University

| term                | type                                                            | #    | definition                                                                 |
|---------------------|-----------------------------------------------------------------|------|----------------------------------------------------------------------------|
| **ec2u:University** | [ec2u:Organization], [*GeoReference*], [org:FormalOrganization] |      | An EC2U partner university                                                 |
| ec2u:dataset        | [ec2u:Dataset]                                                  | 1    | the dataset the resource is published in                                   |
| [skos:altLabel]     | text                                                            | 1    | the short name the university is known by across the alliance, as its city |
| [foaf:depiction]    | uri                                                             | 1..* | images depicting the agent                                                 |
| [foaf:homepage]     | uri                                                             | 1..* | homepages of the agent                                                     |
| ec2u:inception      | year                                                            | 1    | the year the university was founded                                        |
| ec2u:students       | integer                                                         | 1    | the number of students enrolled at the university                          |
| ec2u:city           | [*GeoReference*]                                                | 1    | the city where the university is located                                   |
| ec2u:country        | [*GeoReference*]                                                | 1    | the country where the university is located                                |

[Friend of a Friend (FOAF)]: http://xmlns.com/foaf/spec/

[The Organization Ontology]: https://www.w3.org/TR/vocab-org/

[Simple Knowledge Organization System (SKOS)]: https://www.w3.org/TR/skos-reference/

[ec2u:Organization]: organizations.md#organization

[org:FormalOrganization]: ../vocabularies/org.md#formal-organization

[*GeoReference*]: ./index.md#geo-reference

[ec2u:Dataset]: ./index.md#dataset

[skos:altLabel]: https://www.w3.org/TR/skos-reference/#labels

[foaf:depiction]: http://xmlns.com/foaf/spec/#term_depiction

[foaf:homepage]: http://xmlns.com/foaf/spec/#term_homepage
