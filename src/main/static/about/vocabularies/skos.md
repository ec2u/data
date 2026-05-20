---
title: Simple Knowledge Organization System (SKOS)
---

The [Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-primer/) is a W3C standard for representing
knowledge organization systems such as thesauri, classification schemes, subject heading lists and taxonomies within the
framework of the Semantic Web. SKOS provides a model for expressing the basic structure and content of concept schemes,
enabling the publication and use of vocabularies in a linked data environment.

| prefix | namespace                            | description                                                                                     |
|--------|--------------------------------------|-------------------------------------------------------------------------------------------------|
| skos:  | http://www.w3.org/2004/02/skos/core# | [Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-reference/) vocabulary |

![SKOS data model](index/skos.svg#75)

# Concept Scheme

| term                                                                       | type                     | # | description                                                                                            |
|----------------------------------------------------------------------------|--------------------------|---|--------------------------------------------------------------------------------------------------------|
| [skos:ConceptScheme](https://www.w3.org/TR/skos-reference/#conceptschemes) |                          |   | A set of concepts, optionally including statements about semantic relationships between those concepts |
| [skos:hasTopConcept](https://www.w3.org/TR/skos-reference/#hastopconcept)  | [skos:Concept](#concept) | * | relates a concept scheme to a concept which is topmost in the broader/narrower concept hierarchy       |
| ‹hasConcept› = ^skos:inScheme                                              | [skos:Concept](#concept) | * | relates a concept scheme to a concept which is in that scheme                                          |

# Concept

| term                                                                    | type                                  | #    | description                                                                                                  |
|-------------------------------------------------------------------------|---------------------------------------|------|--------------------------------------------------------------------------------------------------------------|
| [skos:Concept](https://www.w3.org/TR/skos-reference/#concepts)          |                                       |      | An idea or notion; a unit of thought                                                                         |
| [skos:inScheme](https://www.w3.org/TR/skos-reference/#inscheme)         | [skos:ConceptScheme](#concept-scheme) | 1    | relates a resource (for example a concept) to a concept scheme in which it is included                       |
| [skos:topConceptOf](https://www.w3.org/TR/skos-reference/#topconceptof) | [skos:ConceptScheme](#concept-scheme) | 0..1 | relates a concept to the concept scheme that it is a top level concept of                                    |
| [skos:notation](https://www.w3.org/TR/skos-reference/#notations)        | string                                | 0..1 | a notation, also known as classification code, is a string of characters used to uniquely identify a concept |
| [skos:prefLabel](https://www.w3.org/TR/skos-reference/#preflabel)       | text                                  | 1    | the preferred lexical label for a resource, in a given language                                              |
| [skos:altLabel](https://www.w3.org/TR/skos-reference/#altlabel)         | text                                  | *    | an alternative lexical label for a resource                                                                  |
| [skos:hiddenLabel](https://www.w3.org/TR/skos-reference/#hiddenlabel)   | text                                  | *    | a lexical label for a resource that should be hidden when generating visual displays of the resource         |
| [skos:definition](https://www.w3.org/TR/skos-reference/#definition)     | text                                  | 0..1 | a statement or formal explanation of the meaning of a concept                                                |
| [skos:broader](https://www.w3.org/TR/skos-reference/#broader)           | [skos:Concept](#concept)              | *    | relates a concept to a concept that is more general in meaning                                               |
| [skos:narrower](https://www.w3.org/TR/skos-reference/#narrower)         | [skos:Concept](#concept)              | *    | relates a concept to a concept that is more specific in meaning                                              |
| [skos:related](https://www.w3.org/TR/skos-reference/#related)           | [skos:Concept](#concept)              | *    | relates a concept to a concept with which there is an associative semantic relationship                      |
| [skos:exactMatch](https://www.w3.org/TR/skos-reference/#exactmatch)     | [skos:Concept](#concept)              | *    | indicates that two concepts can, with a high degree of confidence, be used interchangeably                   |

> [!WARNING]
> Known deviation from standard:
>
> - according to SKOS best practices, `skos:notation `should be a typed literal; it is specified as string to ease
    interoperability with frontend applications.

