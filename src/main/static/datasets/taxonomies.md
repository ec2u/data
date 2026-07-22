EC2U taxonomies are described using a controlled subset of
the  [Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-reference/)  data model.

| prefix | namespace                            | description                                              |
|--------|--------------------------------------|----------------------------------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/          | EC2U Knowledge Hub vocabulary                            |
| skos:  | http://www.w3.org/2004/02/skos/core# | [Simple Knowledge Organization System (SKOS)] vocabulary |

![taxonomy data model](index/taxonomies.svg#75)

# Taxonomy

| term                          | type                                 | # | description                                 |
|-------------------------------|--------------------------------------|---|---------------------------------------------|
| **ec2u:Taxonomy**             | [ec2u:Dataset], [skos:ConceptScheme] |   | EC2U Knowledge Hub classification taxonomy  |
| [skos:hasTopConcept]          | [ec2u:Topic]                         | * | links to top-level concepts in the taxonomy |
| ‹hasConcept› = ^skos:inScheme | [ec2u:Topic]                         | * | links to concepts in the taxonomy           |

# Topic

| term                | type                            | #    | description                                                            |
|---------------------|---------------------------------|------|------------------------------------------------------------------------|
| **ec2u:Topic**      | [ec2u:Resource], [skos:Concept] |      | Concept included in a [classification taxonomy]                        |
| [skos:inScheme]     | [ec2u:Taxonomy]                 | 1    | link to the taxonomy the concept belongs to                            |
| [skos:topConceptOf] | [ec2u:Taxonomy]                 | 0..1 | link to the taxonomy the concept belongs to as a top-level concept     |
| [skos:broader]      | [ec2u:Topic]                    | *    | links to more general concepts in the taxonomy                         |
| [skos:narrower]     | [ec2u:Topic]                    | *    | links to more specific concepts in the taxonomy                        |
| [skos:related]      | [ec2u:Topic]                    | *    | links to otherwise related concepts in the taxonomy                    |
| [skos:exactMatch]   | [ec2u:Topic]                    | *    | links to entries in other taxonomies defining exactly the same concept |

[Simple Knowledge Organization System (SKOS)]: https://www.w3.org/TR/skos-reference/

[ec2u:Dataset]: ./index.md#dataset

[skos:ConceptScheme]: ../about/vocabularies/skos.md#concept-scheme

[skos:hasTopConcept]: https://www.w3.org/TR/skos-reference/#L2457

[skos:inScheme]: https://www.w3.org/TR/skos-reference/#L2457

[skos:topConceptOf]: https://www.w3.org/TR/skos-reference/#L2457

[ec2u:Topic]: #topic

[classification taxonomy]: #taxonomy

[ec2u:Taxonomy]: #taxonomy

[ec2u:Resource]: ./index.md#resource

[skos:Concept]: ../about/vocabularies/skos.md#concept

[skos:broader]: https://www.w3.org/TR/skos-reference/#L2010

[skos:narrower]: https://www.w3.org/TR/skos-reference/#L2010

[skos:related]: https://www.w3.org/TR/skos-reference/#L2010

[skos:exactMatch]: https://www.w3.org/TR/skos-reference/#L4138
