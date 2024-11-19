---
title: Linked Data Data Models
---

- Linked data structures are defined by *ontologies*, that is by high-level *data models* describing relevant entities,
  related properties and entity relationships
  within a specific business or technical domain.
- Ontologies differentiate themselves from *relational* data models by adopting a *graph-based* representation and
  extensively leveraging *taxonomies*, that is tree-like hierarchical classification schemes.
- Domain entities are represented as nodes whose connections graphically and concisely depict extensive relationship
  networks; connectivity details and entity properties may vary across classification taxonomies, flexibly capturing the
  specificity of each entity type.

![Sample Ontology Graph](index/graph.png#50)

- This modelling approach makes it possible to express complex connectivity patterns, typical of many real-world
  processes, in a simpler yet more expressive and richer graphical language.
- Free from the technical constraints of relational models, ontology-based graphs can more accurately capture complex
  domain structures, closely aligning with the high‑level descriptions provided by subject matter experts.
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

# Notation

Ontologies are documented as human-readable documents containing the following sections:

- introductory notes describing context, requirements, design approach and organisation of the specific ontology version
- formal specifications of the ontology entity types (*classes*)
- formal specifications of the supporting classification schemes (*taxonomies*)

Machine-readable formal versions of the ontologies aligned with human-readable documents are derived from
stakeholder-validated documents and maintained on dedicated technical systems.

## Diagrams

Relationships among groups of related entity types and major entity type properties are graphically summarised at the
beginning of each section using a class diagram notation adapted
from [Unified Modelling Language (UML) 2](https://en.wikipedia.org/wiki/Unified_Modeling_Language).

![Sample UML Diagram](index/uml.png#50)

| concept               | notation                                              | description                                                                                                                                                                                                           |
|-----------------------|-------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| abstract class        | ![UML Abstract Class](index/abstract.png#75)          | `ex:BaseClass` factors common features shared by multiple derived concrete classes; instance membership for abstract classes is implied, rather than actually stored in the graph                                     |
| concrete class        | ![UML Concrete Class](index/concrete.png#75)          | `ex:Class` describes features shared by a set of related resources; instance membership for concrete classes is actually stored in the graph                                                                          |
| class derivation      | ![UML Class Derivation](index/derivation.png#75)      | `ex:Class` is derived from `ex:BaseClass` ; `ex:Class` instances are expected to comply also with  `ex:BaseClass` specifications                                                                                      |
| properties            | ![UML Class Property](index/properties.png#75)        | `ex:Class` instances are expected to have a property `ex:property` with a value of the specific datatype; the number in brackets specifies the multiplicity, that is the expected number of provided values           |
| relationships         | ![UML Class Relationship](index/relationships.png#75) | `ex:Class` instances are expected to be linked to an entity instance of `ex:ReatedClass` through an `ex:property` predicate; the number specifies the multiplicity, that is the expected number of connected entities |
| property multiplicity | `1 `                                                  | exactly one (required)                                                                                                                                                                                                |
|                       | `0..1 `                                               | zero or one (optional)                                                                                                                                                                                                |
|                       | `1..* `                                               | one or more (repeatable)                                                                                                                                                                                              |
|                       | `0..*` or `*`                                         | zero or more (multiple)                                                                                                                                                                                               |
|                       | `m..n `                                               | between m and n inclusive                                                                                                                                                                                             |

## Prefixes

IRI prefixes in use in UML diagrams are detailed in a companion prefix table.

| prefix | namespace                         | description        |
|--------|-----------------------------------|--------------------|
| ex:    | <https://example.org/predicates/> | Example vocabulary |

## Classes

Class specifications are detailed in tabular format, according to the following template.

| term         | type                                                                                                                             | #              | definition                                                                                                                                                                                                                   |
|--------------|----------------------------------------------------------------------------------------------------------------------------------|----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **ex:Class** | [ex:BaseClass](#classes) *inherited class membership specified as cross-links to the specification of the relevant base classes* |                | *class definition*                                                                                                                                                                                                           |
| ex:property  | datatype {constraint}                                                                                                            | {multiplicity} | *literal property specification with expected datatype, multiplicity and additional constraints*                                                                                                                             |
| ex:property  | [ex:RelatedClass](#classes)&#10;{constraint}                                                                                     | {multiplicity} | *entity property specification with expected instance class, multiplicity and additional constraints; class membership for related entities is specified as a cross-links to the specification of the relevant target class* |

Additional property constraints are specified
as [SHACL core constraints components.](https://www.w3.org/TR/shacl/#core-components)

## Notes

Ancillary usage or explanatory notes are highlighted in the following formats:

> [!WARNING]
> Usage note warning of potentially limiting or troublesome data model characteristics.

> [!NOTE]
> Remark / Usage or explanatory note providing context or explaining design choices.

> :question:/:exclamation: Note / Open issue or editorial note.

# Datatypes

To improve modelling robustness and interoperability, values are limited to a controlled set of
standard datatypes, mainly derived from [XML Schema (XSD) 2 Datatypes](https://www.w3.org/TR/xmlschema-2/). This
datatype set is properly supported by compliant SPARQL 1.1
query engines and easily mapped to native datatypes in most programming languages.

| datatype | description                                                                                 | RDF                                                               | JSON                             | Java                         |
|----------|---------------------------------------------------------------------------------------------|:------------------------------------------------------------------|:---------------------------------|------------------------------|
| id       | absolute resource [IRI](https://www.rfc-editor.org/rfc/rfc3987.html)                        | IRI                                                               | `“http://example.net/”`          | `URI`                        |
|          | relative resource [IRI](https://www.rfc-editor.org/rfc/rfc3987.html)                        |                                                                   | `"/path"`                        | `URI`                        |
| boolean  | `true` / `false` flag                                                                       | [xsd:boolean](https://www.w3.org/TR/xmlschema-2/#boolean)         | `boolean`                        | `Boolean`                    |
| string   | textual content                                                                             | [xsd:string](https://www.w3.org/TR/xmlschema-2/#string)           | `string`                         | `String`                     |
| integer  | arbitrary precision integer number (for instance,  `123` )                                  | [xsd:integer](https://www.w3.org/TR/xmlschema-2/#integer)         | `integral number`                | `BigInteger`                 |
| decimal  | arbitrary precision decimal number (for instance, `123.456`)                                | [xsd:decimal](https://www.w3.org/TR/xmlschema-2/#decimal)         | `decimal number`                 | `BigDecimal`                 |
| year     | [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) year                                     | [xsd:gYear](https://www.w3.org/TR/xmlschema-2/#gYear)             | `“yyyy”`                         | `Year`                       |
| date     | [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date                                     | [xsd:date](https://www.w3.org/TR/xmlschema-2/#date)               | `"yyyy-MM-dd"`                   | `LocalDate`                  |
| time     | local  [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date                              | [xsd:time](https://www.w3.org/TR/xmlschema-2/#time)               | `"hh:mm:ss"`                     | `LocalTime`                  |
|          | offset  [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date                             | [xsd:time](https://www.w3.org/TR/xmlschema-2/#time)               | `"hh:mm:ss+hh:mm"`               | `OffsetTime`                 |
| dateTime | local [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date-time                          | [xsd:dateTime](https://www.w3.org/TR/xmlschema-2/#dateTime)       | `"yyyy-MM-ddThh:mm:s.sss"`       | `LocalDateTime`              |
|          | offset [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date-time                         | [xsd:dateTime](https://www.w3.org/TR/xmlschema-2/#dateTime)       | `"yyyy-MM-ddThh:mm:s.sss+hh:mm"` | `OffsetDateTime`             |
| instant  | UTC [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) date-time with millisecond precision | [xsd:dateTime](https://www.w3.org/TR/xmlschema-2/#dateTime)       | `"yyyy-MM-ddThh:mm:s.sssZ"`      | `Instant`                    |
| duration | [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) duration                                 | [xsd:duration](https://www.w3.org/TR/xmlschema-2/#duration)       | `"PyYMMdDThHmMs.sssS"`           |                              |
|          | date-based  [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) duration                     | [xsd:duration](https://www.w3.org/TR/xmlschema-2/#duration)       | `"PyYMMdD"`                      | `Period`                     |
|          | time-based  [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) duration                     | [xsd:duration](https://www.w3.org/TR/xmlschema-2/#duration)       | `"PThHmMs.sssS"`                 | `Duration`                   |
| text     | localised human-readable textual content                                                    | [rdf:langString](https://www.w3.org/TR/rdf-schema/#ch_langstring) | `{ "locale": "text" }`           | ``Map<Locale, String>``      |
|          |                                                                                             |                                                                   | `{ "locale": ["text", …] }`      | ``Map<Locale, Set<String>>`` |

> [!WARNING]
> Due to the limitations of SPARQL 1.1 calendrical functions, `xsd:dateTime` is the preferred temporal
> datatype.

> [!WARNING]
> To improve interoperability with third-party calendrical function libraries, date-based (`PyYMMdD`) and
> time-based (`PThHmMs.sssS`) representations are preferred.

# Taxonomies

Tree-like classification schemes, glossaries and other hierarchical structures are specified using dedicated property
vocabularies standardised by W3C and aligned with the [ISO 25964](https://www.niso.org/schemas/iso25964) thesaurus
standard:

* [RDF Schema (RDFS) 1.1](https://www.w3.org/TR/rdf11-schema/)
* [Simple Knowledge Organization System (SKOS) 1](https://www.w3.org/TR/skos-primer/)

![SKO UML Class Diagram](index/skos.png#66)

| term                   | type               | #    | description                                                                                          |
|------------------------|--------------------|------|------------------------------------------------------------------------------------------------------|
| **skos:ConceptScheme** |                    |      | Hierarchical concept classification scheme.                                                          |
| skos:hasTopConcept     | skos:Concept       | 1..* | identifiers of top-level concepts in the classification scheme                                       |
| **skos:Concept**       |                    |      | Concept belonging to a concept scheme.                                                               |
| skos:prefLabel         | text               | 1    | preferred/formal human-readable concept label                                                        |
| skos:definition        | text               | 0..1 | human-readable concept definition                                                                    |
| skos:inScheme          | skos:ConceptScheme | 1    | link to the scheme the concept belongs to                                                            |
| skos:isTopConceptOf    | skos:ConceptScheme | 0..1 | identifier of the scheme the concept belongs to as a top-level concept; undefined for child concepts |
| skos:broader           | skos:Concept       | *    | links to more general parent concepts; defined only for child concepts                               |
| skos:narrower          | skos:Concept       | *    | links to more specific child concepts                                                                |
| skos:related           | skos:Concept       | *    | links to related concepts not included among broader/narrower categories                             |

> *:information_source:* Property multiplicities are not specified by the W3C standard: they are introduced to simplify
> application-level taxonomy management.