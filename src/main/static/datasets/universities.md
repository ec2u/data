> **⚠️** **Work in progress…**

# Data Model

![university data model](index/universities.svg)

EC2U allied universities are described using a controlled subset of the [Organization Ontology](https://www.w3.org/TR/vocab-org/) data model, extended with:

* [SKOS](https://www.w3.org/TR/skos-primer/#seclabel) labels, as per *Organization Ontology* recommendations
* some internal specialized properties

| prefix | namespace                   | description                                                            |
|--------|-----------------------------|------------------------------------------------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/ | EC2U Knowledge Hub vocabulary                                          |
| org:   | http://www.w3.org/ns/org#   | https://www.w3.org/TR/vocab-org/                                       |
| void:  | http://rdfs.org/ns/void#    | [Vocabulary of Interlinked Datasets (VoID)](http://vocab.deri.ie/void) |

## University

| term                | type                                                                                         | #    | definition                                                                                                |
|---------------------|----------------------------------------------------------------------------------------------|------|-----------------------------------------------------------------------------------------------------------|
| **ec2u:University** | [ec2u:Resource](resources.md#resource), [org:FormalOrganization](agents#formal-organization) |      |                                                                                                           |
| ec2u:schac          |                                                                                              | 1    | the [SCHAC code](https://wiki.uni-foundation.eu/pages/viewpage.action?pageId=12746935) of the institution |
| ec2u:image          |                                                                                              | 1    | the URL of a generic outdoor image                                                                        |
| ec2u:inception      | year                                                                                         | 0..1 | the inception year of the institution                                                                     |
| ec2u:students       | integer                                                                                      | 0..1 | the number of students enrolled at the institution                                                        |
| ec2u:country        | id                                                                                           | 0..1 | the country of the institution                                                                            |
| ec2u:location       | id                                                                                           | 0..1 | the city of the institution                                                                               |

# Sources

* static content from application source code
* background information extracted from [Wikidata](https://www.wikidata.org/)

## Updating

* base static content is updated on demand by manually editing application source code
* background information extracted from Wikidata is crawled nightly using custom data integration scripts that extract structured data from its public SPARQL endpoint
