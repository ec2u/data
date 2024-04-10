Taxonomies provide tree-like subject definitions supporting interactive
resource searches and selective publishing use cases.

# Data Model

EC2U [taxonomies](https://www.w3.org/TR/skos-primer/) are described using a controlled subset of
the  [SKOS](https://www.w3.org/TR/skos-reference/) data model.

| prefix | namespace                            | description                                                                                     |
|--------|--------------------------------------|-------------------------------------------------------------------------------------------------|
| skos:  | http://www.w3.org/2004/02/skos/core# | [Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-reference/) vocabulary |

![concept data model](index/concepts.svg#75)

## Concept Scheme

| term                                                              | type                     | # | description                                 |
|-------------------------------------------------------------------|--------------------------|---|---------------------------------------------|
| [skos:ConceptScheme](https://www.w3.org/TR/skos-reference/#L2457) | [ec2u:Asset](assets.md)  |   | EC2U Knowledge Hub classification taxonomy  |
| [skos:hasTopConcept](https://www.w3.org/TR/skos-reference/#L2457) | [skos:Concept](#concept) | * | links to top-level concepts in the taxonomy |

## Concept

| term                                                             | type                                 | #    | description                                                                                   |
|------------------------------------------------------------------|--------------------------------------|------|-----------------------------------------------------------------------------------------------|
| [skos:Concept](https://www.w3.org/TR/skos-reference/#L2039)      | [rdfs:Resource](resources.md)        |      | Concept included in a [classification taxonomy](#conceptscheme)                               |
| [skos:inScheme](https://www.w3.org/TR/skos-reference/#L2457)     | [skos:ConceptScheme](#conceptscheme) | 1    | link to the taxonomy the concept belongs to                                                   |
| [skos:topConceptOf](https://www.w3.org/TR/skos-reference/#L2457) | [skos:ConceptScheme](#conceptscheme) | 0..1 | link to the taxonomy the concept belongs to as a top-level concept                            |
| [skos:prefLabel](https://www.w3.org/TR/skos-reference/#L1304)    | text                                 | 1    | complete name                                                                                 |
| [skos:altLabel](https://www.w3.org/TR/skos-reference/#L1304)     | text                                 | *    | shortened / informal / alternative name                                                       |
| [skos:hiddenLabel](https://www.w3.org/TR/skos-reference/#L1304)  | text                                 | *    | other names included to support indexing and search operations, but **not** otherwise visible |
| [skos:definition](https://www.w3.org/TR/skos-reference/#L1693)   | text                                 | 0..1 | definition and intended usage description                                                     |
| [skos:broader](https://www.w3.org/TR/skos-reference/#L2010)      | skos:Concept                         | *    | links to more general concepts in the taxonomy                                                |
| [skos:narrower](https://www.w3.org/TR/skos-reference/#L2010)     | skos:Concept                         | *    | links to more specific concepts in the taxonomy                                               |
| [skos:related](https://www.w3.org/TR/skos-reference/#L2010)      | skos:Concept                         | *    | links to otherwise related concepts in the taxonomy                                           |
| [skos:exactMatch](https://www.w3.org/TR/skos-reference/#L4138)   | skos:Concept                         | *    | links to entries in other taxonomies defining exactly the same concept                        |

# Licensing

Individual taxonomies included in the EC2U Knowledge Hub are licensed by their respective publishers under the licensing
terms
specified by
the [dataset](./index.md)  [`dct:rights`](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_rights), [`dct:license`](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_license)
and [`dct:accessRights`](https://www.w3.org/TR/vocab-dcat-2/#Property:resource_access_rights) properties.

# Sources

* static content from application source code

## Updating

* static content is updated on demand by manually editing application source code
