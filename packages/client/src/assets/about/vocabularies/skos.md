---
title: Simple Knowledge Organization System (SKOS)
---

The [Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-primer/) is a W3C standard for representing
knowledge organization systems such as thesauri, classification schemes, subject heading lists and taxonomies within the
framework of the Semantic Web. SKOS provides a model for expressing the basic structure and content of concept schemes,
enabling the publication and use of vocabularies in a linked data environment.

| prefix | namespace                            | description                                              |
|--------|--------------------------------------|----------------------------------------------------------|
| skos:  | http://www.w3.org/2004/02/skos/core# | [Simple Knowledge Organization System (SKOS)] vocabulary |

![SKOS data model](index/skos.svg#75)

# Concept Scheme

| term                                 | type                    | # | description                                                                                            |
|--------------------------------------|-------------------------|---|--------------------------------------------------------------------------------------------------------|
| [skos:ConceptScheme][conceptschemes] |                         |   | A set of concepts, optionally including statements about semantic relationships between those concepts |
| [skos:hasTopConcept]                 | [skos:Concept][concept] | * | topmost concepts in the concept hierarchy of the concept scheme                                        |

# Concept

| term                     | type                                 | #    | description                                                               |
|--------------------------|--------------------------------------|------|---------------------------------------------------------------------------|
| [skos:Concept][concepts] |                                      |      | An idea or notion; a unit of thought                                      |
| [skos:inScheme]          | [skos:ConceptScheme][concept-scheme] | 1    | concept scheme the concept is included in                                 |
| [skos:topConceptOf]      | [skos:ConceptScheme][concept-scheme] | 0..1 | concept scheme the concept is a top level concept of                      |
| [skos:notation]          | string                               | 0..1 | code uniquely identifying the concept within its concept scheme           |
| [skos:prefLabel]         | text                                 | 1    | preferred lexical label of the concept                                    |
| [skos:altLabel]          | text                                 | 0..1 | alternative lexical labels of the concept                                 |
| [skos:hiddenLabel]       | text                                 | 0..1 | lexical labels of the concept excluded from visual displays               |
| [skos:definition]        | text                                 | 0..1 | formal explanation of the meaning of the concept                          |
| [skos:broader]           | [skos:Concept][concept]              | *    | concepts more general in meaning than the concept                         |
| [skos:broaderTransitive] | [skos:Concept][concept]              | *    | concepts more general in meaning than the concept, directly or indirectly |
| [skos:narrower]          | [skos:Concept][concept]              | *    | concepts more specific in meaning than the concept                        |
| [skos:related]           | [skos:Concept][concept]              | *    | concepts associatively related to the concept                             |
| [skos:exactMatch]        | [skos:Concept][concept]              | *    | concepts interchangeable in meaning with the concept                      |

> [!WARNING]
> Known deviation from standard:
>
> - according to SKOS best practices, `skos:notation `should be a typed literal; it is specified as string to ease
		interoperability with frontend applications.

[Simple Knowledge Organization System (SKOS)]: https://www.w3.org/TR/skos-reference/

[conceptschemes]: https://www.w3.org/TR/skos-reference/#conceptschemes

[skos:hasTopConcept]: https://www.w3.org/TR/skos-reference/#hastopconcept

[concept]: #concept

[concepts]: https://www.w3.org/TR/skos-reference/#concepts

[skos:inScheme]: https://www.w3.org/TR/skos-reference/#inscheme

[concept-scheme]: #concept-scheme

[skos:topConceptOf]: https://www.w3.org/TR/skos-reference/#topconceptof

[skos:notation]: https://www.w3.org/TR/skos-reference/#notations

[skos:prefLabel]: https://www.w3.org/TR/skos-reference/#preflabel

[skos:altLabel]: https://www.w3.org/TR/skos-reference/#altlabel

[skos:hiddenLabel]: https://www.w3.org/TR/skos-reference/#hiddenlabel

[skos:definition]: https://www.w3.org/TR/skos-reference/#definition

[skos:broader]: https://www.w3.org/TR/skos-reference/#broader

[skos:broaderTransitive]: https://www.w3.org/TR/skos-reference/#broadertransitive

[skos:narrower]: https://www.w3.org/TR/skos-reference/#narrower

[skos:related]: https://www.w3.org/TR/skos-reference/#related

[skos:exactMatch]: https://www.w3.org/TR/skos-reference/#exactmatch
