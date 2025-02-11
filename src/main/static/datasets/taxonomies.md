EC2U taxonomies are described using a controlled subset of
the  [Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-reference/)  data model.

| prefix | namespace                            | description                                                                                     |
|--------|--------------------------------------|-------------------------------------------------------------------------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/          | EC2U Knowledge Hub vocabulary                                                                   |
| skos:  | http://www.w3.org/2004/02/skos/core# | [Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-reference/) vocabulary |

![taxonomy data model](index/taxonomies.svg#75)

# Taxonomy

| term                                                              | type                                                                                                       | # | description                                 |
|-------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|---|---------------------------------------------|
| **ec2u:Taxonomy**                                                 | [ec2u:Dataset](./index.md#dataset), [skos:ConceptScheme](../handbooks/vocabularies/skos.md#concept-scheme) |   | EC2U Knowledge Hub classification taxonomy  |
| [skos:hasTopConcept](https://www.w3.org/TR/skos-reference/#L2457) | [ec2u:Topic](#topic)                                                                                       | * | links to top-level concepts in the taxonomy |
| ‹hasConcept› = ^skos:inScheme                                     | [ec2u:Topic](#topic)                                                                                       | * | links to concepts in the taxonomy           |

# Topic

| term                                                             | type                                                                                            | #    | description                                                            |
|------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|------|------------------------------------------------------------------------|
| **ec2u:Topic**                                                   | [ec2u:Resource](./index.md#resource), [skos:Concept](../handbooks/vocabularies/skos.md#concept) |      | Concept included in a [classification taxonomy](#taxonomy)             |
| [skos:inScheme](https://www.w3.org/TR/skos-reference/#L2457)     | [ec2u:Taxonomy](#taxonomy)                                                                      | 1    | link to the taxonomy the concept belongs to                            |
| [skos:topConceptOf](https://www.w3.org/TR/skos-reference/#L2457) | [ec2u:Taxonomy](#taxonomy)                                                                      | 0..1 | link to the taxonomy the concept belongs to as a top-level concept     |
| [skos:broader](https://www.w3.org/TR/skos-reference/#L2010)      | [ec2u:Topic](#topic)                                                                            | *    | links to more general concepts in the taxonomy                         |
| [skos:narrower](https://www.w3.org/TR/skos-reference/#L2010)     | [ec2u:Topic](#topic)                                                                            | *    | links to more specific concepts in the taxonomy                        |
| [skos:related](https://www.w3.org/TR/skos-reference/#L2010)      | [ec2u:Topic](#topic)                                                                            | *    | links to otherwise related concepts in the taxonomy                    |
| [skos:exactMatch](https://www.w3.org/TR/skos-reference/#L4138)   | [ec2u:Topic](#topic)                                                                            | *    | links to entries in other taxonomies defining exactly the same concept |
