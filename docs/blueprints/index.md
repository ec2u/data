# Data Types

All resources properties are described using a limited set of
standard [XSD](https://www.w3.org/TR/xmlschema-2/#built-in-datatypes)/[RDF](https://www.w3.org/TR/rdf-schema/#ch_langstring)
datatypes, which are internally mapped to implementation datatypes according to the following table.

| **Datatype** | **Java**| **TypeScript/JSON**  |
| :------------------------------------------------------ | ------------------------------------------------------- | :------------------------------- |
| [xsd:boolean](https://www.w3.org/TR/xmlschema-2/#boolean) | `Boolean` | `boolean`                         |
| [string](https://www.w3.org/TR/xmlschema-2/#string)     | `String` | `string`                          |
| [xsd:integer](https://www.w3.org/TR/xmlschema-2/#integer) | `BigInteger` | `integral number`                 |
| [xsd:decimal](https://www.w3.org/TR/xmlschema-2/#decimal)   | `BigDecimal` | `decimal number`                  |
| [xsd:gYear](https://www.w3.org/TR/xmlschema-2/#gYear)       | `Year` | `“yyyy”`                          |
| [xsd:date](https://www.w3.org/TR/xmlschema-2/#date)         | `LocalDate` | `"yyyy-MM-dd"`                    |
| [xsd:time](https://www.w3.org/TR/xmlschema-2/#time)         | `LocalTime`         | `"hh:mm:ss"`           |
|  | `OffsetTime` | `"hh:mm:ssZ"` |
|  | `OffsetTime` | `"hh:mm:ss+hh:mm"` |
| [xsd:dateTime](https://www.w3.org/TR/xmlschema-2/#dateTime) | `LocalDateTime` | `"yyyy-MM-ddThh:mm:ss"` |
|  | `OffsetDateTime` | `"yyyy-MM-ddThh:mm:ssZ"` |
|  | `OffsetDateTime` | `"yyyy-MM-ddThh:mm:ss+hh:mm"` |
| | `Instant` | `"yyyy-MM-ddThh:mm:ssZ"` |
| [xsd:duration](https://www.w3.org/TR/xmlschema-2/#duration) | `Duration`                       | |
| [xsd:anyURI](https://www.w3.org/TR/xmlschema-2/#anyURI)     | `URI` (relative) | `"/path"`              |
|  | `URI` (absolute) | `“scheme:details”` |
| [rdf:langString](https://www.w3.org/TR/rdf-schema/#ch_langstring) | ``Dictionary extends Map<Locale, String>`` | `{ "locale": "text" }` |

UML diagrams refer to the datatype using the Java mapping, as it is the most specific.