# Data Model

EC2U agents are described using a controlled subset
of
the [FOAF](http://xmlns.com/foaf/spec/) and [Organization Ontology](https://www.w3.org/TR/vocab-org/) data models,
extended with [SKOS](https://www.w3.org/TR/skos-primer/#seclabel) labels, as per *Organization Ontology* recommendations

| prefix | namespace                            | description                                                                          |
|--------|--------------------------------------|--------------------------------------------------------------------------------------|
| foaf:  | http://xmlns.com/foaf/0.1/           | [FOAF Vocabulary Specification 0.99](http://xmlns.com/foaf/spec/)                    |
| org:   | http://www.w3.org/ns/org#            | [The Organization Ontology](https://www.w3.org/TR/vocab-org/)                        |
| skos:  | http://www.w3.org/2004/02/skos/core# | [Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-reference/) |

![agent data model](index/agents.svg)

## Agent

| term                                                         | type                          | # | definition                                                        |
|--------------------------------------------------------------|-------------------------------|---|-------------------------------------------------------------------|
| [foaf:Agent](http://xmlns.com/foaf/spec/#term_Agent)         | [rdfs:Resource](resources.md) |   | Anagent performing an activity, for instance a document publisher |
| [foaf:depiction](http://xmlns.com/foaf/spec/#term_depiction) | id                            | * | links to visual representations of the agent                      |
| [foaf:homepage](http://xmlns.com/foaf/spec/#term_homepage)   | id                            | * | links to public main web pages for the agent                      |
| [foaf:mbox](http://xmlns.com/foaf/spec/#term_mbox)           | string                        | * | contact email addresses for the agent                             |
| [foaf:phone](http://xmlns.com/foaf/spec/#term_phone)         | string                        | * | contact phone numbers for the agent                               |

> `❗️` According to the standard `foaf:mbox/phone` should be IRIs

## Organization

| term                                                           | type                                           | #    | definition               |
|----------------------------------------------------------------|------------------------------------------------|------|--------------------------|
| **org:Organization**                                           | [foaf:Agent](#agent)                           |      |                          |
| [skos:prefLabel](https://www.w3.org/TR/skos-reference/#labels) | text                                           | 1    | formal name              |
| [skos:altLabel](https://www.w3.org/TR/skos-reference/#labels)  | text                                           | *    | informal/shortened names |
| [skos:definition](https://www.w3.org/TR/skos-reference/#L1693) | text                                           | 0..1 |                          |
| org:identifier                                                 | typed                                          | *    |                          |
| org:classification                                             | skos:Concept                                   | *    |                          |
| org:subOrganizationOf                                          | [org:Organization](#organization)              | *    |                          |
| org:hasSubOrganization                                         | [org:Organization](#organization)              | *    |                          |
| org:hasUnit                                                    | [org:OrganizationalUnit](#organizational-unit) | *    |                          |
| org:hasMember                                                  | [foaf:Person](#person)                         | *    |                          |
| ‹hasHead› = ^org:headOf                                        | [foaf:Person](#person)                         | *    |                          |

## Formal Organization

| term                       | type                              | # | definition |
|----------------------------|-----------------------------------|---|------------|
| **org:FormalOrganization** | [org:Organization](#organization) |   |            |

## Organizational Collaboration

| term                                | type                              | # | definition |
|-------------------------------------|-----------------------------------|---|------------|
| **org:OrganizationalCollaboration** | [org:Organization](#organization) |   |            |

## Organizational Unit

| term                       | type                              | #    | definition |
|----------------------------|-----------------------------------|------|------------|
| **org:OrganizationalUnit** | [org:Organization](#organization) |      |            |
| org:unitOf                 | [org:Organization](#organization) | 1..* |            |

## Person

| term                                                       | type                              | #    | definition |
|------------------------------------------------------------|-----------------------------------|------|------------|
| **[foaf:Person](http://xmlns.com/foaf/spec/#term_Person)** | [foaf:Agent](#agent)              |      |            |
| foaf:title                                                 | string                            | 0..1 |            |
| foaf:givenName                                             | string                            | 1    |            |
| foaf:familyName                                            | string                            | 1    |            |
| org:memberOf                                               | [org:Organization](#organization) | *    |            |
| org:headOf                                                 | [org:Organization](#organization) | *    |            |
