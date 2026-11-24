---
title: Accessing the API
---

The hub publishes every dataset through a read-only REST API, serving each resource as plain JSON at its own address.
Clients need no account, key or SDK: any HTTP library reads the data, and a browser opens the same addresses. This guide
covers what every request has in common: addresses, headers, how queries travel, responses, limits and errors.

> [!TIP]
> The companion [Querying the API](api-queries) guide covers the queries that select, expand, filter, sort and page
> the data each request returns; the [API & Data Model](/api/) reference lists the properties of each resource type.

> [!TIP]
> The examples in this guide run unchanged with `curl` or any API testing tool. The responses shown are samples: as
> the hub keeps harvesting its sources, actual responses may hold other values, counts and resources.

> [!NOTE]
> Using the API takes no linked data knowledge, but its JSON is a view of a linked data graph: the
> [Linked Data](linked-data/) primer explains how the two relate, for clients integrating the hub with other linked
> data sources. The API is built on the open-source [QEST](https://github.com/grafctory/qest) framework, whose
> documentation fully specifies the data model and the query language these guides introduce by example, including the
> formal grammar of every query.

# Addresses

Every resource of the hub is identified by an absolute URL under `https://data.ec2u.eu/`, and the same URL retrieves its
description through the API. Datasets and their resources follow the address layout below.

| Address                                 | Resource                                           | Reference                      |
|-----------------------------------------|----------------------------------------------------|--------------------------------|
| `https://data.ec2u.eu/`                 | the catalogue of the datasets published by the hub | [Datasets](/api/ec2u-datasets) |
| `https://data.ec2u.eu/{dataset}/`       | a dataset, listing its member resources            | [Dataset](/api/ec2u-dataset)   |
| `https://data.ec2u.eu/{dataset}/{code}` | a single resource of the dataset                   | [API & Data Model](/api/)      |

Discover datasets from the catalogue rather than assuming a fixed set: it lists the address of every dataset the hub
publishes, including any dataset added after a client was written, with no change needed to the client.

Responses state the identifiers of hub resources in root-relative form, such as `/universities/pavia`, and those of
external resources as absolute URLs. Resolve a root-relative identifier against `https://data.ec2u.eu/` to get the
address of the resource, which is also its linked data identifier. Queries accept identifiers in either form.

# Methods

The API supports retrieval alone, and every resource accepts the same methods.

| Method    | Effect                                                              |
|-----------|---------------------------------------------------------------------|
| `GET`     | retrieves the resource                                              |
| `HEAD`    | returns the headers a `GET` would, without the body                 |
| `OPTIONS` | returns `204 No Content` with an `Allow` header listing the methods |

Any other method gets `405 Method Not Allowed`, with the same `Allow` header.

# Headers

The `Accept` header decides whether an address returns data or the web interface. A request ranking `text/html` first,
as browsers do when following a link, gets the page of the interactive search tool showing the resource. Any other
request gets JSON data, including requests stating `application/json`, a wildcard or no `Accept` header at all, as HTTP
libraries do by default. Responses vary by `Accept`, so HTTP caches keep the two representations apart.

The `Accept-Language` header selects the language of localised properties, such as names and descriptions. Each value is
returned in the first language of the header it is available in, and left out when it is available in none of them, so
list fallback languages to receive a value whenever one exists. A request naming no language, or only the `*`
wildcard, receives language-neutral values alone: clients should always state their languages.

The request below asks for Finnish, then English. The university states no Finnish name, so its English one is returned;
asking for Italian first would return `Università di Pavia` instead, as the university also states that name.

```shell
curl --get --header 'Accept-Language: fi, en;q=0.5' \
  --data-urlencode '={"id":{},"prefLabel":{}}' \
  'https://data.ec2u.eu/universities/pavia'
```

```json
{
  "id": "/universities/pavia",
  "prefLabel": "University of Pavia"
}
```

To receive several languages side by side, rather than the best match alone, request the language map of a property, as
described under [Localised Text](api-queries#localised-text) in the companion guide.

# Queries

A request with no query returns the default view of the resource: every public property, with linked resources stated as
identifiers rather than expanded. A dataset lists its members in `resources` as identifiers alone.

```shell
curl --header 'Accept-Language: en' 'https://data.ec2u.eu/universities/pavia'
```

The response below is abridged to a few properties of the university: the [University](/api/ec2u-university)
reference lists them in full, stating the type of each and whether it holds a single value or several.

```json
{
  "id": "/universities/pavia",
  "dataset": "/universities/",
  "label": "University of Pavia",
  "altLabel": "Pavia",
  "inception": "1361",
  "city": "http://www.wikidata.org/entity/Q6259",
  "country": "http://www.wikidata.org/entity/Q38",
  "homepage": [
    "https://portale.unipv.it/it",
    "https://web-en.unipv.it/"
  ],
  "latitude": 45.18675,
  "longitude": 9.15586
}
```

To get exactly the data it needs in a single request, a client appends a query to the address. The query names the
properties to retrieve and the linked resources to expand, and filters, sorts and pages datasets. It takes one of the
two forms below, both described with examples in the [Querying the API](api-queries) guide:

- **JSON Template**: a JSON object stating the properties to retrieve, the resources to expand and the criteria to
	apply, sent as the whole query string, either URL-encoded or base64url-encoded, with no field name before it
- **Form Criteria**: filters, sorting and paging stated as `name=value` fields on a dataset address, as a web form sends
	them, each matching member of the dataset being returned in its default view

In JavaScript, URL-encode the serialised template and append it after the `?` of the address:

```js
const query = {id: {}, prefLabel: {}, inception: {}};

const response = await fetch(`https://data.ec2u.eu/universities/pavia?${encodeURIComponent(JSON.stringify(query))}`, {
    headers: {"Accept-Language": "en"}
});

const university = await response.json();
```

With `curl`, pass the template to `--data-urlencode` together with `--get`, prefixed with `=` as in the examples of
these guides: without the prefix, `curl` would take the text before the first `=` of a template as a field name and
leave it unencoded, breaking every template holding a filter or a computed value.

# Responses

Responses are plain JSON, which clients process with no linked data tooling. Each resource carries its identifier under
`id`, and links to other resources hold their identifiers, which a client follows with further requests or expands in
the same request, as described in the companion [Querying the API](api-queries) guide.

- **Values**: booleans, numbers and strings; dates and times are ISO 8601 strings, and timestamps carry a time zone
	offset, such as `2026-11-03T15:00:00+01:00`, which the date libraries of every platform parse directly
- **Multiple Values**: a property that may hold several values always returns an array, also when it holds a single
	value, so that clients handle a single form; the order of the array carries no meaning
- **Localised Text**: a single string in the negotiated language, or a map keyed by language tag where the query
	requests the language map, holding one entry for each requested language the property is available in
- **Missing Values**: a property with no value is left out of the response, never stated as `null` or `[]`

# Status Codes

| Status                      | Meaning                                                                    |
|-----------------------------|----------------------------------------------------------------------------|
| `200 OK`                    | the body holds the resource as JSON                                        |
| `204 No Content`            | the response to an `OPTIONS` request                                       |
| `400 Bad Request`           | the query cannot be decoded; the body holds the error message              |
| `404 Not Found`             | the hub holds no resource at the address                                   |
| `405 Method Not Allowed`    | the method is not supported; the `Allow` header lists the supported ones   |
| `422 Unprocessable Content` | the query is well formed but invalid for the resource or beyond the limits |
| `500 Internal Server Error` | the hub failed to serve the request; the body is empty                     |

A `422` response states every problem of the query at once, in a JSON structure that mirrors the query and maps each
offending entry to what is wrong with it, such as a property unknown to the [data model](/api/) or a criterion stated on
a property holding a single value. A `500` response signals a fault of the hub rather than of the request: retry it
later, as the same request may succeed unchanged once the hub has recovered from the fault.

The query below asks for a property the data model does not define and for a page larger than the server allows. The
server rejects it with the response that follows, stating both problems in a single body.

```shell
curl --include --get --data-urlencode '={"resources":{"id":{},"title":{},"#":500}}' 'https://data.ec2u.eu/events/'
```

```http
HTTP/1.1 422 Unprocessable Content
Vary: Accept
Content-Type: application/json; charset=utf-8

[
  {
    "0": [
      {
        "resources": [
          {
            "title": [
              "unknown property path"
            ],
            "#": [
              "exceeded maximum result set limit <100>"
            ]
          }
        ]
      }
    ]
  }
]
```

# Limits

The server bounds every query, so that a single request cannot overload the hub.

- **Page Size**: a dataset returns at most 100 resources per request, also when the query states no page size, and
	rejects a page size of `0`; fetch further pages with the [paging criteria](api-queries#sorting-and-paging)
- **Nesting**: expansions of linked resources and property paths in criteria may reach three levels deep

A query exceeding either bound is rejected with `422 Unprocessable Content`, never silently truncated: a client never
receives a partial result it could mistake for a complete one, and learns at once which bound to respect.
