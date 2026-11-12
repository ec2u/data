---
title: Notation
---

The [APIs & Models](/about/models/) pages document each type of resource the hub serves. Every page opens with a
description of the resource type and then lists its properties in the format selected from the page menu:

- **Properties** sets them out as a table, using the notation described below
- **TypeScript** states them as a TypeScript interface, for use in client code
- **JSON Schema** states them as a JSON Schema, for validating API payloads

# Properties

Each row of the properties table describes one property of the resource type.

| column      | content                                                                                                        |
|-------------|----------------------------------------------------------------------------------------------------------------|
| property    | name of the property in JSON payloads, linked to the definition of the RDF predicate it maps to                |
| type        | [datatype](/about/rdf/datatypes) of the property values, or the linked name of the resource type they refer to |
| #           | multiplicity, that is the number of values the property admits                                                 |
| description | summary of the meaning of the property                                                                         |

The `id` and `type` rows describe the IRI identifying each resource and the IRI of its class. Both are set by the
server.

A property admitting values of different types lists each alternative on a line of its own, prefixed by `|`. Localised
text is typed as `Dictionary`, that is a map from language tags to text in that language.

Multiplicities are stated as follows; required properties have their multiplicity set in bold.

| multiplicity | meaning                         |
|--------------|---------------------------------|
| `1`          | exactly one value (required)    |
| `0‥1`        | at most one value (optional)    |
| `1‥*`        | one or more values (required)   |
| `*`          | any number of values (optional) |
| `m‥n`        | between `m` and `n` values      |

Properties inherited from a more general resource type are grouped after the ones the type declares, under a heading
linking to the type they are inherited from.

# Details

Unfolding a row discloses the rest of the property description, followed by the entries the property states.

| entry      | content                                                                                   |
|------------|-------------------------------------------------------------------------------------------|
| label      | human-readable name of the property                                                       |
| predicate  | RDF predicate linking the resource to the property values                                 |
| inverse    | RDF predicate linking the property values back to the resource                            |
| id space   | IRI template the identifiers of the resources must match                                  |
| pattern    | regular expression the values must match                                                  |
| characters | number of characters each value admits                                                    |
| languages  | languages the values may be stated in; `one value each` admits a single text per language |
| integral   | values must be integer numbers                                                            |
| minimum    | lower bound of the values                                                                 |
| maximum    | upper bound of the values                                                                 |
| values     | closed list of the values admitted                                                        |
| value      | values that must be present                                                               |
| read-only  | values are set by the server or by the linked resources, and may not be submitted         |
| lifecycle  | `bound` linked resources are removed together with the resource referring to them         |

Where alternative types state different constraints, each constraint is prefixed by the name of the type it applies to.

# Model

The sidebar locates the resource type within the model. Entries with nothing to state are left out.

| entry         | content                                                            |
|---------------|--------------------------------------------------------------------|
| Classes       | RDF class of the resources, linked to its definition               |
| Endpoint      | API endpoint serving the resources                                 |
| Checks        | additional checks the resources must pass                          |
| Extends       | more general resource types this type inherits properties from     |
| Extended By   | more specific resource types inheriting properties from this type  |
| Referenced By | resource types with properties referring to resources of this type |
