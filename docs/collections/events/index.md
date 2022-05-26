---
title: Events
---

![event data model](index.svg)

EC2U events are described using a controlled subset of the [schema:Event](https://schema.org/Event) data model, with the
following major deviations:

* property types and cardinality are tightly specified and constrained

* only events of interest to the academic population are included, so properties like `schema:typicalAgeRange` or
  `schema:audience` are not included.

# Minimal Model

The following properties are strongly suggested as a minimal description for events published from local sources:

| property                           | datatype         | description                     | notes                                                        |
| ---------------------------------- | ---------------- | ------------------------------- | ------------------------------------------------------------ |
| `schema:url`                       | URI              | link to the original event page |                                                              |
| `schema:name`                      | `Dictionary`     | title                           | if no language information is included, the system will assume the local language of the publishing university; missing translations in other alliance languages may be automatically provided by the system |
| `schema:image`                     | `URI`            | link to a related image         |                                                              |
| `schema:description`               | `Dictionary`     | exteneded  description          | if no language information is included, the system will assume the local language of the publishing university; missing translations in other alliance languages may be automatically provided by the system |
| `schema:disambiguatingDescription` | `Dictionary`     | short description               | if no language information is included, the system will assume the local language of the publishing university; missing translations in other alliance languages may be automatically provided by the system; if missing, may be utomatically extracted from` `s ``schema:description` |
| `schema:startDate`                 | `OffsetDateTime` | start date/time                 | ISO 8601 offset format (`yyyy-MM-ddThh:mm:ss+hh:mm`) strongly suggested; other formats will be automatically converted assuming the local time zone of  the publishing university; missing time is normalized to `00:00:00` |
| `schema:endDate`                   | `OffsetDateTime` | end date/time                   | ISO 8601 offset format (`yyyy-MM-ddThh:mm:ss+hh:mm`) strongly suggested; other formats will be automatically converted assuming the local time zone of  the publishing university; missing time is normalized to `00:00:00` |
| `schema:location`                  | URI              | location                        | reference to a location described with a least a name        |

# Inbox

```
rdf:type :URI
rdfs:label : Dictionary
rdfs:comment : Dictionary [0..1]

dct:title : Dictionary
dct:subject : Dictionary
dct:description : Dictionary
dct:publisher : URI [0..1]
dct:source : URI [0..1]
dct:issued :Instant [0..1]
dct:created :Instant [0..1]
dct:modified :Instant [0..1]

ec2u:university

schema:url :URI [0..1]
schema:name :Dictionary
schema:image :URI [0..1]
schema:description :Dictionary
schema:disambiguatingDescription :Dictionary [0..1]

schema:startDate :OffsetDateTime
schema:endDate : OffsetDateTime [0..1]
schema:inLanguage :String
schema:isAccessibleForFree :Boolean [0..1]

schema:eventStatus
schema:organizer
schema:location
```
