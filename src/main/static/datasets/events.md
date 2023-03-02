This dataset is mainly intended to support event search on the [My Mobile Tutor](https://mmt.ec2u.eu) mobile app developed by WP2 of the EC2U project under the coordination of the University of Turku, but can be searched and integrated by third-party tools as any other EC2U dataset.

# Data Model

![event data model](index/events.svg)

EC2U events are described using a controlled subset of the [schema:Event](https://schema.org/Event) data model, with the
following major deviations:

* only events of interest to the academic population are included, so properties like `schema:typicalAgeRange` or
  `schema:audience` are not included.

## Minimal Model

The following properties are strongly suggested as a minimal description for events published from local sources:

| property                                     | description          | notes                                                        |
| -------------------------------------------- | -------------------- | ------------------------------------------------------------ |
| all [ec2u:Resource](/datasets/resources) properties | inherited properties |                                                              |
| all [schema:Thing](things.md) properties     | inherited properties |                                                              |
| `schema:startDate`                           | start date/time      | ISO 8601 offset format (`yyyy-MM-ddThh:mm:ss+hh:mm`) strongly suggested; other formats will be automatically converted assuming the local time zone of  the publishing university; missing time is normalized to `00:00:00` |
| `schema:endDate`                             | end date/time        | ISO 8601 offset format (`yyyy-MM-ddThh:mm:ss+hh:mm`) strongly suggested; other formats will be automatically converted assuming the local time zone of  the publishing university; missing time is normalized to `00:00:00` |
| `schema:location`                            | location             | reference to a location described with a least a name        |

# Licensing

> ❗️source-level license / copyright holder

# Updating

* Data sources are crawled nightly using custom data integration scripts that extract structured data from dedicated
  APIs, RSS feed, embedded HTML micro-annotations or embedded JSON/LD metadata; custom scraping from HTML content is
  currently not supported in order to improve the overall robustness of the process
* Stale events are removed nightly just before source crawling; events are considered stale if either:
  * the latest between `schema:starDate` and `schema:endDate` timestamp is in the past
  * no date info is provided and the event was crawled more than a month in the past

---
# QA Queries

| stats          | URL                                                          |
| -------------- | ------------------------------------------------------------ |
| global         | `https://data.ec2u.eu/events/?.stats`                        |
| by university  | `https://data.ec2u.eu/events/?.terms=university`             |
| by publisher   | `https://data.ec2u.eu/events/?.terms=publisher`              |
| filtering      | stats queries may be filtered by adding the following parameters to the base URL |
| by last update | `https://data.ec2u.eu/events/?.stats&>modified=2022-06-01T00:00:00Z` |
| by end date    | `https://data.ec2u.eu/events/?.stats&>endDate=2022-06-01T00:00:00Z` |

