EC2U taxonomies are described using a controlled subset of
the  [Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-reference/)  data model.

| prefix | namespace                            | description                                              |
|--------|--------------------------------------|----------------------------------------------------------|
| ec2u:  | https://data.ec2u.eu/terms/          | EC2U Knowledge Hub vocabulary                            |
| skos:  | http://www.w3.org/2004/02/skos/core# | [Simple Knowledge Organization System (SKOS)] vocabulary |

![taxonomy data model](index/taxonomies.svg#75)

# Taxonomy

| term                        | type                                 | #    | description                                                                     |
|-----------------------------|--------------------------------------|------|---------------------------------------------------------------------------------|
| **ec2u:Taxonomy**           | [ec2u:Dataset], [skos:ConceptScheme] |      | A standardised topic taxonomy or other concept scheme for classifying resources |
| ec2u:version                | string                               | 0..1 | the release of the taxonomy, as identified by its publisher                     |
| [skos:hasTopConcept]        | [ec2u:Topic]                         | *    | topmost concepts in the concept hierarchy of the concept scheme                 |
| ‹resources› = ^ec2u:dataset | [ec2u:Topic]                         | *    | resources published in the dataset                                              |

# Topic

| term                     | type                            | #    | description                                                                  |
|--------------------------|---------------------------------|------|------------------------------------------------------------------------------|
| **ec2u:Topic**           | [ec2u:Resource], [skos:Concept] |      | A topic for classifying resources, as defined by a [classification taxonomy] |
| ec2u:dataset             | [ec2u:Taxonomy]                 | 1    | the dataset the resource is published in                                     |
| [skos:inScheme]          | [ec2u:Taxonomy]                 | 1    | the concept scheme the concept is included in                                |
| [skos:topConceptOf]      | [ec2u:Taxonomy]                 | 0..1 | the concept scheme the concept is a top level concept of                     |
| [skos:broader]           | [ec2u:Topic]                    | *    | concepts more general in meaning than the concept                            |
| [skos:broaderTransitive] | [ec2u:Topic]                    | *    | concepts more general in meaning than the concept, directly or indirectly    |
| [skos:narrower]          | [ec2u:Topic]                    | *    | concepts more specific in meaning than the concept                           |
| [skos:related]           | [ec2u:Topic]                    | *    | concepts associatively related to the concept                                |
| [skos:exactMatch]        | [ec2u:Topic]                    | *    | concepts interchangeable in meaning with the concept                         |

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

[skos:broaderTransitive]: https://www.w3.org/TR/skos-reference/#L2413

[skos:narrower]: https://www.w3.org/TR/skos-reference/#L2010

[skos:related]: https://www.w3.org/TR/skos-reference/#L2010

[skos:exactMatch]: https://www.w3.org/TR/skos-reference/#L4138
