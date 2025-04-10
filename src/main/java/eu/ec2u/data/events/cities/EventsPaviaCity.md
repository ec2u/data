# Site

* http://www.vivipavia.it/
    * http://www.vivipavia.it/site/home/eventi.html
    * Comune di Pavia / ViviPavia
    * City of Pavia / ViviPavia

# API

* HTML Microdata / Schema.org
    * http://www.vivipavia.it/site/cdq/listSearchArticle.jsp

# Integration

* custom article crawler
* extractor based on standard HTML Microdata parser

## 2022-06-10

* Fix conversion of event locations
    * bnodes are converted to skolemized IRIs
    * name are repositiond from misplaced postal address descriptions

# Content

* `schema:url`
* `schema:name`
* `schema:description`
* `schema:image`
* `schema:startDate`
* `schema:endDate`
* `schema:eventStatus`
* `schema:location`
    * `schema:name`
    * `schema:address`
        * `schema:streetAddress`
        * `schema:addressLocation`

# Samples

```http
GET http://www.vivipavia.it/site/cdq/listSearchArticle.jsp?new=yes&instance=10&channel=34&size=9999&node=4613&fromDate=2022-05-01
```

```xml

```
