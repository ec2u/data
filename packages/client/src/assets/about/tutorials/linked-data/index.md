---
title: Linked Data Data Models
---

- Linked data structures are defined by *ontologies*, that is by high-level *data models* describing relevant entities,
	related properties and entity relationships within a specific business or technical domain.
- Ontologies differentiate themselves from *relational* data models by adopting a *graph-based* representation and
	extensively leveraging *taxonomies*, that is tree-like hierarchical classification schemes.
- Domain entities are represented as nodes whose connections graphically and concisely depict extensive relationship
	networks; connectivity details and entity properties may vary across classification taxonomies, flexibly capturing the
	specificity of each entity type.

![Sample Ontology Graph](index/graph.png#50)

- This modelling approach makes it possible to express complex connectivity patterns, typical of many real-world
	processes, in a simpler yet more expressive and richer graphical language.
- Free from the technical constraints of relational models, ontology-based graphs can more accurately capture complex
	domain structures, closely aligning with the high‑level descriptions provided by subject-matter experts.
- At the same time, ontologies provide a formal, machine‑readable description of domain data structures, which can
	support advanced model-driven technical processes, such as data validation and extraction of tacit knowledge through
	logical inference.

# Standards

Ontologies are based on a formal graph data model standardised by [W3C](https://www.w3.org) under
the [Data Activity](https://www.w3.org/2013/data/) (formerly [Semantic Web Activity](https://www.w3.org/2001/sw/))
umbrella to improve interoperability of knowledge management systems; they rely in particular on the following core
components:

- [Resource Description Framework (RDF) 1.1](https://www.w3.org/TR/rdf11-primer/)

- [RDF Schema (RDFS) 1.1](https://www.w3.org/TR/rdf11-schema/)

RDF models all data structures as **directed labelled graphs**, where **nodes** represent either **entities** or
**literal** values and **edges** labelled with **property** names represents specific types of relationships among
entities and literal values.

![Sample RDF Graph](index/rdf.png#75)

Both entities and properties are uniquely and globally identified by an absolute URL, for instance:

- https://example.org/artworks/the-mona-lisa

- https://example.org/relationships/was-created-by

- https://example.org/authors/leonardo-da-vinci

Unique global identifiers simplify data exchange across different knowledge management systems and the definition of
standardized and reusable property vocabularies, which further improve data interoperability.

Each graph connection, also known as a **triple**, describe an atomic knowledge fact relating a source node
(**subject**) to a target node or literal value (**object**) through specific property (**predicate**), for instance:

```turtle
<https://example.org/artworks/the-mona-lisa>
	<https://example.org/predicates/was-created-by>
	<https://example.org/authors/leonardo-da-vinci> . 
```

In order to improve readability, URL are usually shortened by factoring common entity **bases** and predicate
**prefixes**:

```turtle
base <https://example.org/>
prefix ex: <https://example.org/predicates/>

<artworks/the-mona-lisa> ex:was-created-by <authors/leonardo-da-vinci> .
```

RDF data is usually managed by dedicated graph databases, also known as **triple stores**, and queried through dedicated
data formats, protocols and query languages standardized by W3C, in particular:

- [SPARQL 1.1 Graph Query Language](https://www.w3.org/TR/sparql11-overview/)
- [SPARQL 1.1 Graph Update Language](https://www.w3.org/TR/sparql11-update/)

Expected connectivity patterns and other data constraints are formalized as ontologies leveraging a family of related
data modelling languages standardized by W3C, in particular:

- [Web Ontology Language (OWL) 2](https://www.w3.org/TR/owl2-primer/)
- [Shapes Constraint Language (SHACL) 1](https://www.w3.org/TR/shacl/)

Ontologies are structured around **classes**, that is sets of related entity **instances** that share common description
patterns and constraints.

Repeating description patterns and constraints may be factored to a **base class** description inherited by multiple
specific **derived classes**: instance entities of derived classes are expected to comply with patterns and constraints
specified both by their immediate class and recursively by all its base classes.
