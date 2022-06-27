---
title: Datasets
---

| collection                      | context                       |
| ------------------------------- | ----------------------------- |
| [datasets](datasets.md)         | -                             |
| [universities](universities.md) | -                             |
| [units](units.md)               | https://data.ec2u.eu/units/   |
| [persons](persons.md)           | https://data.ec2u.eu/persons/ |
| [events](events.md)             | https://data.ec2u.eu/events/  |

![resource data model](models/resources.svg)

# Vocabularies

EC2U resources are described using a controlled subset of
the [Dublin Core](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) data model.

All generic human-readable labels and descriptions are localized either in English or in one of the local EC2U partner
languages.

# Datatypes

All resources properties are described using a limited set of
standard [XSD](https://www.w3.org/TR/xmlschema-2/#built-in-datatypes)
/ [RDF](https://www.w3.org/TR/rdf-schema/#ch_langstring)
datatypes, which are internally mapped to implementation datatypes according to the following table.

| **Datatype** | **Java**| **TypeScript/JSON**  |
| :------------------------------------------------------ | ------------------------------------------------------- | :------------------------------- |
| [xsd:boolean](https://www.w3.org/TR/xmlschema-2/#boolean) | `Boolean` | `boolean`                         |
| [xsd:string](https://www.w3.org/TR/xmlschema-2/#string) | `String` | `string`                          |
| [xsd:integer](https://www.w3.org/TR/xmlschema-2/#integer) | `BigInteger` | `integral number`                 |
| [xsd:decimal](https://www.w3.org/TR/xmlschema-2/#decimal)   | `BigDecimal` | `decimal number`                  |
| [xsd:gYear](https://www.w3.org/TR/xmlschema-2/#gYear)       | `Year` | `“yyyy”`                          |
| [xsd:date](https://www.w3.org/TR/xmlschema-2/#date)         | `LocalDate` | `"yyyy-MM-dd"`                    |
| [xsd:time](https://www.w3.org/TR/xmlschema-2/#time)         | `LocalTime`         | `"hh:mm:ss"`           |
|  | `OffsetTime` | `"hh:mm:ss+hh:mm"` |
| [xsd:dateTime](https://www.w3.org/TR/xmlschema-2/#dateTime) | `LocalDateTime` | `"yyyy-MM-ddThh:mm:ss"` |
|  | `OffsetDateTime` | `"yyyy-MM-ddThh:mm:ss+hh:mm"` |
| | `Instant` | `"yyyy-MM-ddThh:mm:ssZ"` |
| [xsd:duration](https://www.w3.org/TR/xmlschema-2/#duration) | `Duration`                       | |
| [xsd:anyURI](https://www.w3.org/TR/xmlschema-2/#anyURI)     | `URI` (relative) | `"/path"`              |
|  | `URI` (absolute) | `“scheme:details”` |
| [rdf:langString](https://www.w3.org/TR/rdf-schema/#ch_langstring) | ``Dictionary extends Map<Locale, String>`` | `{ "locale": "text" }` |

UML diagrams refer to the datatype using the Java mapping.