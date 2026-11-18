---
title: Querying the API
---

The hub API lets each client shape the responses it reads. In a single request, a client states which properties to
retrieve and how deeply to expand linked resources, filters, sorts and pages a dataset, and computes the counts and
ranges a search interface displays. This guide introduces the query language through examples on the universities and
events datasets, from single resources to filtered, sorted and computed dataset views.

> [!TIP]
> The companion [Accessing the API](api-access) guide covers the addresses, headers, limits, status codes and responses
> of each request; the [API & Data Model](/api/) reference lists the properties of each resource type.

> [!TIP]
> The examples in this guide run unchanged with `curl` or any API testing tool. The responses shown are samples: as
> the hub keeps harvesting its sources, actual responses may hold other values, counts and resources.

> [!NOTE]
> Using the API takes no linked data knowledge, but its JSON is a view of a linked data graph: the
> [Linked Data](linked-data/) primer explains how the two relate, for clients integrating the hub with other linked
> data sources. The API is built on the open-source [QEST](https://github.com/metreeca/qest) framework, whose
> documentation fully specifies the data model and the query language these guides introduce by example, including the
> formal grammar of every query.

# Templates

A query is a JSON template mirroring the response it asks for. It lists the properties to retrieve, each mapped to the
empty object `{}`, whatever its type or cardinality, and the response holds those properties alone. The empty template
`{}` returns the default view of the resource, holding every public property with linked resources left unexpanded.

```json
{
  "id": {},
  "prefLabel": {},
  "inception": {},
  "dataset": {
    "id": {},
    "label": {}
  }
}
```

```shell
curl --get --header 'Accept-Language: en' \
  --data-urlencode '={"id":{},"prefLabel":{},"inception":{},"dataset":{"id":{},"label":{}}}' \
  'https://data.ec2u.eu/universities/pavia'
```

```json
{
  "id": "/universities/pavia",
  "prefLabel": "University of Pavia",
  "inception": "1361",
  "dataset": {
    "id": "/universities/",
    "label": "EC2U Universities"
  }
}
```

A link mapped to `{}` returns the identifier of the linked resource. Nesting a template under the link expands the
linked resource in the same response instead: the query above returns the identifier and the label of the dataset of the
university, so that a page renders the link to the dataset with no further request.

A dataset is retrieved the same way: its `resources` entry holds the template applied to each member. The examples below
state the template alone, to be sent to the address shown as [Accessing the API](api-access#queries) describes.

```http request
GET https://data.ec2u.eu/events/?<query>
```

```json
{
  "resources": {
    "id": {},
    "name": {},
    "startDate": {}
  }
}
```

The hub checks each query against the data model before running it, and rejects a property the model does not define
with `422 Unprocessable Content`, describing the problem as the [Status Codes](api-access#status-codes) section shows.

# Filters

Filters sit beside the properties retrieved for each member of a dataset, keyed by an operator followed by the property
they constrain. A resource is returned when it satisfies every filter, and filters combine freely with sorting and
paging. Filters apply to datasets alone: stated on a property holding a single value, they are rejected with `422`.

| Filter                   | Selects resources whose property                     |
|--------------------------|------------------------------------------------------|
| `"<property": value`     | holds a value less than the given one                |
| `">property": value`     | holds a value greater than the given one             |
| `"<=property": value`    | holds a value less than or equal to the given one    |
| `">=property": value`    | holds a value greater than or equal to the given one |
| `"~property": "text"`    | holds a value containing every word of the text      |
| `"?property": [options]` | holds at least one of the options                    |
| `"!property": [options]` | holds every one of the options                       |

- **Comparison**: numbers and dates compare in their natural order and strings by Unicode code point, so that upper case
  sorts before lower case; a resource where the property is unset never matches a comparison
- **Text Search**: words match anywhere in a value, in any order, ignoring case but not diacritics
- **Options**: a single value or an array of values, such as strings, numbers or resource identifiers; `null` matches
	resources where the property is unset, and an empty array leaves the dataset unfiltered, so that a client can send the
  selections of a facet as they stand, even when the reader has selected nothing

The query below retrieves the first three events of one university starting from a given date, in chronological order.

```json
{
  "resources": {
    "id": {},
    "label": {},
    "startDate": {},
    "?university": "/universities/pavia",
    ">=startDate": "2026-11-20T00:00:00Z",
    "^startDate": "asc",
    "#": 3
  }
}
```

```json
{
  "resources": [
    {
      "id": "/events/79eff7ae-8001-3501-ba35-2c1c89a36483",
      "label": "Between Prompt and Reality: Artificial Intelligence and Communication",
      "startDate": "2026-11-25T18:00:00+01:00"
    },
    {
      "id": "/events/1f055489-54b6-3628-898a-3434c19513ed",
      "label": "Musica, parola, figura, canto: Interdisciplinary Approaches",
      "startDate": "2026-11-26T00:00:00+01:00"
    },
    {
      "id": "/events/477998b1-888a-3f0b-bb04-ec4c427f9cf3",
      "label": "Primo Levi. An Island of Reason for a Troubled Present. Four Lectures on \"The Drowned and the Saved…",
      "startDate": "2026-11-26T00:00:00+01:00"
    }
  ]
}
```

A filter may also target a property path, following links through dot-separated steps, or a computed value, as described
under [Facets](#facets). The query below selects events tagged with at least two topics, one of which has a label
mentioning science, with no need to retrieve the topics themselves or to count them on the client.

```json
{
  "resources": {
    "id": {},
    "~keywords.prefLabel": "science",
    ">=count:keywords": 2
  }
}
```

# Sorting and Paging

| Criterion                | Effect                                                                |
|--------------------------|-----------------------------------------------------------------------|
| `"^property": "asc"`     | sorts resources by the property, ascending                            |
| `"^property": "desc"`    | sorts resources by the property, descending                           |
| `"^property": n`         | sorts by the property at precedence n, descending where n is negative |
| `"+property": [options]` | ranks resources whose property holds one of the options first         |
| `"@": n`                 | skips the first n resources                                           |
| `"#": n`                 | returns at most n resources, up to the server limit                   |

Sort keys stated as numbers combine by precedence, `1` being the first: `"^startDate": 1` with `"^name": -2` sorts
events by date, then by name in reverse within the same date. Resources where a sort property is unset come first in
ascending order and last in descending order, whatever the precedence of the key.

Ranking with `+` moves the resources holding the options ahead of the others, keeping the regular order within each
group. It suits a search interface keeping the values a reader selected at the top of a list, with no filtering.

Paging is stable: the hub breaks ties between equal sort values in a fixed order, so that successive pages of the same
query neither repeat nor skip resources, as long as the data does not change between requests. A dataset returns at most
100 resources per request, as stated under [Limits](api-access#limits): page through larger results with `@`.

# Facets

A query may replace the retrieved properties with computed bindings, each keyed as `"name=expression"`, returning one
row for each distinct combination of values rather than one entry per resource. An expression is a property path,
optionally preceded by transforms each followed by a colon, as in `year:startDate`, or `count:` counting rows.

| Transforms                          | Compute                                        |
|-------------------------------------|------------------------------------------------|
| `count`, `sum`, `min`, `max`, `avg` | a summary of the values of each group of rows  |
| `abs`, `floor`, `ceil`, `round`     | a number derived from a number                 |
| `lower`, `upper`, `length`          | a string, or its length, derived from a string |
| `year`, `month`, `day`              | a component extracted from a date              |
| `hours`, `minutes`, `seconds`       | a component extracted from a time              |

A binding holding a summary transform groups the rows by the values of the other bindings, so grouping by a property and
counting the members of each group yields the values of a facet with their counts. The query below lists the
universities holding events from a given date by descending count, expanding each to the label shown beside it.

```json
{
  "resources": {
    "university=university": {
      "id": {},
      "label": {}
    },
    "count=count:": {},
    "^count:": "desc",
    ">=startDate": "2026-12-01T00:00:00Z"
  }
}
```

The response holds one row per university, the first two of which are shown below.

```json
{
  "resources": [
    {
      "university": {
        "id": "/universities/jena",
        "label": "Friedrich Schiller University Jena"
      },
      "count": 74
    },
    {
      "university": {
        "id": "/universities/coimbra",
        "label": "University of Coimbra"
      },
      "count": 57
    }
  ]
}
```

Sort and rank criteria of a computed query name the expression of a binding, as `^count:` does above, never its name.
Rows holding the same values collapse into one, so add an `id` binding where each resource needs a row of its own.

With no grouping binding, summaries range over the whole dataset. The query below returns the number of events of a
university and the date range they span, as a search interface needs to size a date filter.

```json
{
  "resources": {
    "count=count:": {},
    "min=min:startDate": {},
    "max=max:startDate": {},
    "?university": "/universities/pavia"
  }
}
```

```json
{
  "resources": [
    {
      "count": 51,
      "min": "2026-11-03T15:00:00+01:00",
      "max": "2027-01-11T00:00:00+01:00"
    }
  ]
}
```

Filters added to a computed query narrow the values to the resources matching the current search. Each facet thus
reflects the selections made on the others, and never offers a value that would return no results.

# Form Criteria

A dataset also accepts filters, sorting and paging stated as form fields, as a web form sends them. The criteria apply
to the members of the dataset, each returned in its default view, with no template to write.

```http request
GET https://data.ec2u.eu/events/?university=/universities/pavia&~name=music&%5EstartDate=asc&%23=25
```

Form fields take the same operators as templates, with a few shorthands:

- **Options**: a field with no operator, as `university=` above, stands for `?`; a repeated `?`, `!` or `+` field
	collects its values into a single option set, while any other field may appear only once in the same request
- **Comparison**: `<=` and `>=` may also follow the property name, as in `startDate>=2026-12-01`
- **Values**: text may be left unquoted, as `music` is above, and language-tagged values are stated as `text@en`
- **Encoding**: percent-encode the operators URLs reserve, that is `^` as `%5E`, `<` as `%3C`, `>` as `%3E`, `#` as
	`%23`, and `+` as `%2B`, which form decoding would otherwise read as a space between words

Criteria beyond this shorthand, such as expanded links and computed values, take the template form.

# Localised Text

Localised properties such as `name` return a single string by default, in the language negotiated through the
`Accept-Language` header, as described under [Headers](api-access#headers). Filters and sort keys on a localised
property apply to the same negotiated value, so a text search matches what the reader sees.

To retrieve several languages at once, map the property to the language tags wanted: `{ "*": {} }` returns every
language, and `{ "en": {}, "fr": {} }` returns English and French alone, whatever the `Accept-Language` header states.
The response then holds a map keyed by language tag, with an entry for each requested language the value is stated in.

```json
{
  "id": {},
  "prefLabel": {
    "en": {},
    "it": {}
  }
}
```

```json
{
  "id": "/universities/pavia",
  "prefLabel": {
    "en": "University of Pavia",
    "it": "Università di Pavia"
  }
}
```

# Mixed Properties

A few properties hold values of different kinds. The `location` of an event, for instance, is either a plain text or a
description of a place, a postal address or a virtual location. Map such a property to one numbered alternative per
kind: `{}` for plain values, and the properties to retrieve for each kind of description, nested descriptions included.

```json
{
  "location": {
    "0": {},
    "1": {
      "name": {},
      "address": {
        "addressLocality": {}
      }
    },
    "2": {
      "addressLocality": {},
      "streetAddress": {}
    }
  }
}
```

The numbers only label the alternatives: the hub matches each value to the alternatives whose properties fit its kind,
whatever their order. Values matching no alternative are left out, so state an alternative for every kind needed.
