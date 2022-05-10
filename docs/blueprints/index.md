# Data Types

All resources properties are described using a limited set of
standard [XSD datatypes](https://www.w3.org/TR/xmlschema-2/#built-in-datatypes), which are internally mapped to
implementation datatypes according to the following table.

| **Internal Name** | **XSD Type**                                            | **TypeScript/JSON**               | **
Java**                         | | :---------------- | :------------------------------------------------------ | :
-------------------------------- | :------------------------------- | | boolean
| [boolean](https://www.w3.org/TR/xmlschema-2/#boolean)   | `boolean`                         | `Boolean`
| | string | [string](https://www.w3.org/TR/xmlschema-2/#string)     | `string`                          | `String`
| | integer | [integer](https://www.w3.org/TR/xmlschema-2/#integer)   | `integral number`                 | `BigInteger`
| | decimal | [decimal](https://www.w3.org/TR/xmlschema-2/#decimal)   | `decimal number`                  | `BigDecimal`
| | year | [gYear](https://www.w3.org/TR/xmlschema-2/#gYear)       | `“yyyy”`                          | `Year`
| | date | [date](https://www.w3.org/TR/xmlschema-2/#date)         | `"yyyy-MM-dd"`                    | `LocalDate`
| | time | [time](https://www.w3.org/TR/xmlschema-2/#time)         | `"hh:mm:ss[+hh:mm|Z]"`            | `LocalTime`
/`OffsetTime`         | | timestamp | [dateTime](https://www.w3.org/TR/xmlschema-2/#dateTime)
| `"yyyy-MM-ddThh:mm:ss[+hh:mm|Z]"` | `LocalDateTime`/`OffsetDateTime` | | duration
| [duration](https://www.w3.org/TR/xmlschema-2/#duration) | | `Duration`                       | | reference
| [anyURI](https://www.w3.org/TR/xmlschema-2/#anyURI)     | `"/{resource}"`                   | `URI`
|