---
title: Linked Data
---

This primer introduces the concepts behind the datasets of the hub, for developers new to linked data and JSON-LD. It
covers the linked data approach, the data model, ontologies and the JSON-based format used to exchange data. It closes
with how the hub applies these concepts, as a bridge to the guides on accessing and querying its API.

> [!TIP]
> Linked data is useful background, but it is not needed to work with the hub. The [REST API](../api-access) serves
> idiomatic JSON, with plain keys, nested objects and arrays, that any frontend developer can recognise and use at once
> with standard tools. The linked data layer stays out of the way and matters only when merging with other datasets.

# Principles

Linked data is a way of publishing structured data on the web, so that datasets from independent sources can be
connected and reused together. It rests on a few simple principles, shared by all linked data publishers:

- every entity and every property is identified by a URL
- looking up a URL returns a description of the identified thing in a standard format
- descriptions refer to other things through their URLs, forming a global graph of data

Global identifiers let independent systems refer to the same entities and share common property vocabularies, with no
need to agree in advance on local keys or schemas, which greatly simplifies data exchange and integration.

# Data Model

The [Resource Description Framework (RDF) 1.1](https://www.w3.org/TR/rdf11-primer/) is the W3C data model underlying
linked data. RDF represents data as a **directed labelled graph**. **Nodes** are entities or **literal** values such as
text, numbers and dates. **Edges** are labelled with **properties** stating how two nodes are related.

![Sample RDF Graph](index/rdf.png#75)

Each edge is a **triple** stating one atomic fact: a **subject** entity is related through a **predicate** to an
**object**, which is either another entity or a literal value, as in the statement below about the Mona Lisa.

```turtle
<https://example.org/artworks/the-mona-lisa>
	<https://example.org/terms/creator>
	<https://example.org/persons/leonardo-da-vinci> .
```

To improve readability, URLs are usually shortened by declaring a **base** for entities and **prefixes** for property
vocabularies. Text literals may carry a language tag, so that a property can hold values in several languages.

```turtle
base <https://example.org/>
prefix ex: <https://example.org/terms/>

<artworks/the-mona-lisa> a ex:Artwork ;
	ex:title "The Mona Lisa"@en, "La Gioconda"@it ;
	ex:creator <persons/leonardo-da-vinci> .
```

RDF data is stored in graph databases, known as **triple stores**, and accessed through standard W3C languages:

- [SPARQL 1.1 Query](https://www.w3.org/TR/sparql11-overview/) — retrieves data matching graph patterns
- [SPARQL 1.1 Update](https://www.w3.org/TR/sparql11-update/) — inserts, modifies and deletes data

# Domain Models

An ontology is a data model describing the entities, properties and relationships of a business or technical domain.
Unlike relational models, ontologies describe data as a graph and make extensive use of **taxonomies**, that is
hierarchical classification schemes organising entities from general to specific.

![Sample Ontology Graph](index/graph.png#50)

Graph models express complex connectivity patterns directly, closely matching the way domain experts describe their
field. They are also machine-readable, so they can drive data validation and derive implicit facts by logical inference.

Ontologies are organised around **classes**, that is sets of entities sharing common properties and constraints. A
**derived class** inherits from its **base classes**: its instances must comply with the constraints of their own class
and, recursively, with those of all its base classes, so that shared constraints are stated only once.

Ontologies are published as **vocabularies** of classes and properties, each identified by a URL. Independent datasets
using the same vocabulary share the meaning of its terms, so that generic tools can read data from any publisher using
them. Widely adopted vocabularies such as [schema.org](https://schema.org/) cover common domains like events and
courses.

Ontologies are written in the following W3C modelling languages:

- [RDF Schema (RDFS) 1.1](https://www.w3.org/TR/rdf11-schema/) — classes, properties and their hierarchies
- [Web Ontology Language (OWL) 2](https://www.w3.org/TR/owl2-primer/) — logical definitions supporting inference
- [Shapes Constraint Language (SHACL)](https://www.w3.org/TR/shacl/) — constraints supporting data validation
- [Simple Knowledge Organization System (SKOS)](https://www.w3.org/TR/skos-primer/) — taxonomies and their concepts

# Exchange Format

[JSON-LD 1.1](https://www.w3.org/TR/json-ld11/) is the W3C format for exchanging RDF data as plain JSON. Developers can
process a JSON-LD document as ordinary JSON, while linked data tools read the same document as an RDF graph.

The document below states the same facts as the Turtle example above:

```json
{
	"@context": {
		"@base": "https://example.org/",
		"@vocab": "https://example.org/terms/",
		"title": { "@container": "@language" },
		"creator": { "@type": "@id" }
	},
	"@id": "artworks/the-mona-lisa",
	"@type": "Artwork",
	"title": { "en": "The Mona Lisa", "it": "La Gioconda" },
	"creator": "persons/leonardo-da-vinci"
}
```

JSON-LD gives a few reserved keywords a specific meaning:

- `@context` — maps plain JSON keys to property URLs and states the base for relative identifiers
- `@id` — identifies the entity described by the object, as a URL relative to the base
- `@type` — states the class of the entity

The context may also declare how values are read: `title` holds a language map, with one entry per language tag, and
`creator` holds the identifier of another entity. Linked entities may also be embedded as nested objects with their own
`@id`, so that a single document can describe a whole connected portion of the graph in one response.

The context is often published at a URL and referenced rather than embedded. Applications that only need the data can
then ignore it altogether and read the document as plain JSON, with no linked data tooling.

# Hub Datasets

The hub applies these concepts to every dataset it publishes. Each resource is identified by a URL under
`https://data.ec2u.eu/`, and looking up that URL returns its description. Resources refer to universities, units,
taxonomy concepts and other resources through their URLs, so that all datasets form a single connected graph.

The data model reuses established vocabularies wherever one fits, such as [schema.org](https://schema.org/),
[Dublin Core](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/), [DCAT](https://www.w3.org/TR/vocab-dcat/),
[SKOS](https://www.w3.org/TR/skos-reference/), the [Organization Ontology](https://www.w3.org/TR/vocab-org/) and
[FOAF](http://xmlns.com/foaf/spec/). It defines terms of its own under `https://data.ec2u.eu/terms#` only where no
established vocabulary applies. Shared classifications, such as event topics, are SKOS taxonomies under `/taxonomies/`.

The API serves this graph as plain JSON. Each resource carries its identifier under `id`, and links hold the identifiers
of the resources they refer to. Localised properties return the value in the preferred language of the client, or a
language map like the `title` of the example above when every language is requested. The guides below cover the API:

- [Accessing the API](../api-access) — how to address resources, negotiate formats and languages, and handle errors
- [Querying the API](../api-queries) — how to retrieve, expand, filter, sort and count dataset resources
- [API & Data Model](/api/) — the reference of the hub API: its datasets, their resource types and their properties
