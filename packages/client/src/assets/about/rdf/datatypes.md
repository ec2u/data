---
title: Datatypes
---

To improve modelling robustness and interoperability, values are limited to a controlled set of standard datatypes,
mainly derived from [XML Schema (XSD) 2 Datatypes](https://www.w3.org/TR/xmlschema-2/). This datatype set is properly
supported by compliant SPARQL 1.1 query engines and easily mapped to native datatypes in most programming languages.

| datatype   | description                                                        | RDF              | JSON                          |
|------------|--------------------------------------------------------------------|:-----------------|:------------------------------|
| boolean    | `true` / `false` flag                                              | [xsd:boolean]    | `boolean`                     |
| byte       | 8-bit signed integer number                                        | [xsd:byte]       | `integral number`             |
| short      | 16-bit signed integer number                                       | [xsd:short]      | `integral number`             |
| int        | 32-bit signed integer number                                       | [xsd:int]        | `integral number`             |
| long       | 64-bit signed integer number                                       | [xsd:long]       | `integral number`             |
| float      | single precision floating point number                             | [xsd:float]      | `number`                      |
| double     | double precision floating point number                             | [xsd:double]     | `number`                      |
| integer    | arbitrary precision integer number (for instance, `123`)           | [xsd:integer]    | `integral number`             |
| decimal    | arbitrary precision decimal number (for instance, `123.456`)       | [xsd:decimal]    | `decimal number`              |
| string     | textual content                                                    | [xsd:string]     | `string`                      |
| text       | single-line plain text                                             | [xsd:string]     | `string`                      |
| markdown   | [Markdown] text                                                    | [xsd:string]     | `string`                      |
| email      | email address                                                      | [xsd:string]     | `"user@example.net"`          |
| phone      | [ITU-T E.164] telephone number                                     | [xsd:string]     | `"+390123456789"`             |
| tag        | [BCP 47] language tag                                              | [xsd:string]     | `"en-GB"`                     |
| iri        | absolute IRI                                                       | [xsd:string]     | `"urn:example:item"`          |
|            | root-relative IRI                                                  | [xsd:string]     | `"/path"`                     |
|            | relative IRI                                                       | [xsd:string]     | `"path"`                      |
| url        | hierarchical URL with scheme and authority                         | [xsd:string]     | `"https://example.net/"`      |
| year       | [ISO 8601] year, with optional timezone offset                     | [xsd:gYear]      | `"yyyy"`                      |
| date       | [ISO 8601] date, with optional timezone offset                     | [xsd:date]       | `"yyyy-MM-dd"`                |
| time       | [ISO 8601] time of day, with optional timezone offset              | [xsd:time]       | `"hh:mm:ss"`                  |
| instant    | [ISO 8601] date-time, with optional timezone offset                | [xsd:dateTime]   | `"yyyy-MM-ddThh:mm:ss"`       |
| timestamp  | UTC [ISO 8601] date-time with millisecond precision                | [xsd:dateTime]   | `"yyyy-MM-ddThh:mm:ss.sssZ"`  |
| duration   | [ISO 8601] duration                                                | [xsd:duration]   | `"PnYnMnDTnHnMnS"`            |
| dictionary | localised human-readable textual content                           | [rdf:langString] | `{ "locale": "text" }`        |
|            |                                                                    |                  | `{ "locale": ["text", …] }`   |

> [!WARNING]
> Due to the limitations of SPARQL 1.1 calendrical functions, `xsd:dateTime` is the preferred temporal
> datatype.

[xsd:boolean]: https://www.w3.org/TR/xmlschema-2/#boolean

[xsd:byte]: https://www.w3.org/TR/xmlschema-2/#byte

[xsd:short]: https://www.w3.org/TR/xmlschema-2/#short

[xsd:int]: https://www.w3.org/TR/xmlschema-2/#int

[xsd:long]: https://www.w3.org/TR/xmlschema-2/#long

[xsd:float]: https://www.w3.org/TR/xmlschema-2/#float

[xsd:double]: https://www.w3.org/TR/xmlschema-2/#double

[xsd:integer]: https://www.w3.org/TR/xmlschema-2/#integer

[xsd:decimal]: https://www.w3.org/TR/xmlschema-2/#decimal

[xsd:string]: https://www.w3.org/TR/xmlschema-2/#string

[xsd:gYear]: https://www.w3.org/TR/xmlschema-2/#gYear

[xsd:date]: https://www.w3.org/TR/xmlschema-2/#date

[xsd:time]: https://www.w3.org/TR/xmlschema-2/#time

[xsd:dateTime]: https://www.w3.org/TR/xmlschema-2/#dateTime

[xsd:duration]: https://www.w3.org/TR/xmlschema-2/#duration

[rdf:langString]: https://www.w3.org/TR/rdf-schema/#ch_langstring

[ISO 8601]: https://en.wikipedia.org/wiki/ISO_8601

[Markdown]: https://commonmark.org/

[ITU-T E.164]: https://www.itu.int/rec/T-REC-E.164

[BCP 47]: https://www.rfc-editor.org/info/bcp47
