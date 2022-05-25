# Site

* https://www.jena-veranstaltungen.de/
  * Stadt Jena / Veranstaltungskalender
  * City of Jena / Event Calendar


# CMS

* https://typo3.org/

# API

* https://www.jena-veranstaltungen.de/veranstaltungen

* JSON-LD

  * extensive page-level JSON-LD metadata

  * no global index
    * crawling?

    * undocumented JSON API (see below)

  * apparently lots of entries for repeating events
    * one entry for each day?

* SOLR Searh (undocumented)

  * ```http
    POST https://www.jena-veranstaltungen.de/?ndssolr=search&L=0&no_cache=1
    Content-Type: application/json
    
    {"q":"*","selectedFilter":[],"page":0}
    ```

* JSON (undocumented)

  * ```http
    POST https://www.jena-veranstaltungen.de/veranstaltungen?ndssearch=fullsearch&no_cache=1&L=0
    Content-Type: application/json
    
    {
        "pageId": 127,
        "contentId": 955,
        "languageId": 0,
        "languageIsocode": "de",
        "sources": [
            "ndsdestinationdataevent"
        ],
        "searchFilter": {
            "ndsdestinationdataevent": {
                "city": {
                    "1": "Jena",
                    "14": "San Jose"
                },
                "district": [ ],
                "cityMode": "init",
                "geolocation": {
                    "latitude": 0,
                    "longitude": 0,
                    "distance": "20000"
                },
                "startDate": "2022-05-23",
                "endDate": "2022-08-21",
                "showRecurring": true,
                "formOptions": {
                    "categories": {
                        "33": {
                            "id": 33,
                            "title": "Märkte & Feste"
                        },
                        "37": {
                            "id": 37,
                            "title": "Religion & Glauben"
                        },
                        "39": {
                            "id": 39,
                            "title": "Sport & Aktiv"
                        },
                        "45": {
                            "id": 45,
                            "title": "Comedy & Kabarett"
                        },
                        "46": {
                            "id": 46,
                            "title": "Disco & Party"
                        },
                        "47": {
                            "id": 47,
                            "title": "Essen & Trinken"
                        },
                        "49": {
                            "id": 49,
                            "title": "Politik & Stadtgesellschaft"
                        },
                        "50": {
                            "id": 50,
                            "title": "Wissenschaft & Bildung"
                        },
                        "679": {
                            "id": 679,
                            "title": "Kunst & Ausstellungen"
                        },
                        "681": {
                            "id": 681,
                            "title": "Führungen & Stadtrundgänge"
                        },
                        "682": {
                            "id": 682,
                            "title": "Shows & Tanz"
                        },
                        "683": {
                            "id": 683,
                            "title": "Theater & Inszenierungen"
                        },
                        "686": {
                            "id": 686,
                            "title": "Konzerte & Klassik"
                        },
                        "693": {
                            "id": 693,
                            "title": "Film / Kino / Multimedia"
                        },
                        "694": {
                            "id": 694,
                            "title": "Messen / Tagungen / Kongresse"
                        },
                        "695": {
                            "id": 695,
                            "title": "Vorträge / Lesungen / Diskussionen"
                        }
                    },
                    "cities": {
                        "1": {
                            "id": 1,
                            "title": "Jena",
                            "district": null,
                            "short_name": ""
                        },
                        "3": {
                            "id": 3,
                            "title": "Seitenroda",
                            "district": null,
                            "short_name": ""
                        },
                        "10": {
                            "id": 10,
                            "title": "Bürgel",
                            "district": null,
                            "short_name": ""
                        },
                        "14": {
                            "id": 14,
                            "title": "San Jose",
                            "district": null,
                            "short_name": ""
                        },
                        "19": {
                            "id": 19,
                            "title": "Großschwabhausen",
                            "district": null,
                            "short_name": ""
                        }
                    }
                },
                "bookableFilter": true
            },
            "additionalSearchOptions": {
                "showMainCategoriesInFilter": "0",
                "keepFiltersForNewSearch": "0"
            }
        },
        "sorting": ""
    }
    ```

# Integration

*

# Content

*

# Pending

* initial integration
* initial survey mentions structured APIs under development
  * re-contact for updates

# Samples

```http

```

```xml

```
