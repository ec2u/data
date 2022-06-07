# Site

* https://www.jena-veranstaltungen.de/veranstaltungen
  * Stadt Jena / Veranstaltungskalender
  * City of Jena / Event Calendar

# API

* JSON-LD + schema.org

  * https://typo3.org/
  * extensive page-level JSON-LD metadata
  * no global index
  * one event description for each instance of repeating events

* SOLR Search (undocumented)

  * ```http
    POST https://www.jena-veranstaltungen.de/?ndssolr=search&L=0&no_cache=1
    Content-Type: application/json
    
    {
      "q": "*",
      "selectedFilter": [
        "tx_ndsdestinationdataevent_domain_model_event"
      ],
      "page": 0
    }
    ```

* JSON Search (undocumented)

  * ```http
    POST https://www.jena-veranstaltungen.de/veranstaltungen?ndssearch=fullsearch&no_cache=1&L=0
    Accept: application/json
    Content-Type:  application/json
    ```

  - see network traffic for (large)  payload details

# Integration

* no structured event index
  * event URLs are retrieved from the SOLR search API
* data extracted from schema.org-based event description embedded into each page as
  a `<script type="application/ld+json">` HTML head element

## Pending

* filter out immaterial events (e.g. children, …)
* extract location/organizer structured address
* initial survey mentions structured APIs under development
  * re-contact for updates

## 2022-06-07

* fixed multiple `startDate`/`endDate` for repeating events
* fixed multiple labels in`schema:organizer`/`schema:location`

## 2022-05-26

* initial integration

# Content

* `schema:url`
* `schema:name`
* `schema:image`
* `schema:description`
* `schema:startDate`
* `schema:endDate`
* `schema:organizer`
* `schema:location`
* `dct:subject`

# Samples

```http

```

```xml

```
