---
title: REST/JSON-LD API
---

> ❗️Work in progress

> * RDF data model
> * dataset RDF context
> * RDF › JSON-LD field mapping

> catalog access
>
> resource access
>
> faceted search

# Datatypes

All resources properties are described using a limited set of standard [XSD](https://www.w3.org/TR/xmlschema-2/#built-in-datatypes)
/ [RDF](https://www.w3.org/TR/rdf-schema/#ch_langstring) datatypes, which are internally mapped to implementation datatypes according to the following table.

| Datatype | RDF                                                          | Java                         | TypeScript/JSON               |
| -------- | :----------------------------------------------------------- | ---------------------------- | :---------------------------- |
| boolean  | [xsd:boolean](https://www.w3.org/TR/xmlschema-2/#boolean)    | `Boolean`                    | `boolean`                     |
| string   | [xsd:string](https://www.w3.org/TR/xmlschema-2/#string)      | `String`                     | `string`                      |
| integer  | [xsd:integer](https://www.w3.org/TR/xmlschema-2/#integer)    | `BigInteger`                 | `integral number`             |
| decimal  | [xsd:decimal](https://www.w3.org/TR/xmlschema-2/#decimal)    | `BigDecimal`                 | `decimal number`              |
| year     | [xsd:gYear](https://www.w3.org/TR/xmlschema-2/#gYear)        | `Year`                       | `“yyyy”`                      |
| date     | [xsd:date](https://www.w3.org/TR/xmlschema-2/#date)          | `LocalDate`                  | `"yyyy-MM-dd"`                |
| time     | [xsd:time](https://www.w3.org/TR/xmlschema-2/#time)          | `LocalTime`                  | `"hh:mm:ss"`                  |
|          |                                                              | `OffsetTime`                 | `"hh:mm:ss+hh:mm"`            |
| datetime | [xsd:dateTime](https://www.w3.org/TR/xmlschema-2/#dateTime)  | `LocalDateTime`              | `"yyyy-MM-ddThh:mm:ss"`       |
|          |                                                              | `OffsetDateTime`             | `"yyyy-MM-ddThh:mm:ss+hh:mm"` |
|          |                                                              | `Instant`                    | `"yyyy-MM-ddThh:mm:ssZ"`      |
| duration | [xsd:duration](https://www.w3.org/TR/xmlschema-2/#duration)  | `Period`                     | `PyYMMdD`                     |
|          |                                                              | `Duration`                   | `PThHmMsS`                    |
| iri      | [xsd:anyURI](https://www.w3.org/TR/xmlschema-2/#anyURI)      | `URI` (relative)             | `"/path"`                     |
|          |                                                              | `URI` (absolute)             | `“scheme:details”`            |
| text     | [rdf:langString](https://www.w3.org/TR/rdf-schema/#ch_langstring) | ``Map<Locale, String>``      | `{ "locale": "text" }`        |
|          |                                                              | ``Map<Locale, Set<String>>`` | `{ "locale": ["text"] }`      |
