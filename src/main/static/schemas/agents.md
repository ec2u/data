> **⚠️** **Work in progress…**

# Data Model

| prefix | namespace                            | description                                                                                     |
|--------|--------------------------------------|-------------------------------------------------------------------------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/          | EC2U Knowledge Hub vocabulary                                                                   |
| foaf:  | http://xmlns.com/foaf/0.1/           | [FOAF Vocabulary Specification 0.99](http://xmlns.com/foaf/spec/)                               |
| org:   | http://www.w3.org/ns/org#            | [The Organization Ontology](https://www.w3.org/TR/vocab-org/)                                   |
| skos:  | http://www.w3.org/2004/02/skos/core# | [Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-reference/) vocabulary |

## Agent

| term       | type          | # | definition |
|------------|---------------|---|------------|
| foaf:Agent | rdfs:Resource |   |            |

## Organization

| term                                                           | type       | # | definition               |
|----------------------------------------------------------------|------------|---|--------------------------|
| org:Organization                                               | foaf:Agent |   |                          |
| [skos:prefLabel](https://www.w3.org/TR/skos-reference/#labels) |            |   | formal name              |
| [skos:altLabel](https://www.w3.org/TR/skos-reference/#labels)  |            |   | informal/shortened names |
| skos:definition                                                |            |   |                          |

### Formal Organization

| term                   | type             | # | definition |
|------------------------|------------------|---|------------|
| org:FormalOrganization | org:Organization |   |            |

### Organizational Collaboration

| term                            | type             | # | definition |
|---------------------------------|------------------|---|------------|
| org:OrganizationalCollaboration | org:Organization |   |            |

### Organizational Unit

| term                   | type             | # | definition |
|------------------------|------------------|---|------------|
| org:OrganizationalUnit | org:Organization |   |            |

## Person

| term        | type       | # | definition |
|-------------|------------|---|------------|
| foaf:Person | foaf:Agent |   |            |
