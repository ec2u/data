# Site

* https://www.ghislieri.it/calendario-eventi/
  * Fondazione Ghislieri / Calendario Eventi
  * Ghislieri Foundation / Events Calendar

# CMS

* WordPress + [EventON](https://www.myeventon.com) plugin

# ~~Integration~~

* no catalog level structured data
* no crawling entry point
* no useable search facilities

# 2022-07-27

* initial assessment

# API

## Search

* no easily accessible event search API
  * search facilities available from details pages return preformatted HTML results
  * no details on the plugin site
* no crawlable entry page

## HTML Microdata

### Catalog

* incudes only highlighted events for the current month

```http
GET https://www.ghislieri.it/calendario-eventi/
```

```html
<div id="event_14409" class="eventon_list_event evo_eventtop  event" data-event_id="14409" data-time="1656925200-1661526000" data-colr="#fcc875" itemscope itemtype="http://schema.org/Event" 1>
  …
</div>
```

### Details

* malformed dates
* repeated `schema:description` elements

```http
GET https://www.ghislieri.it/evento/ciclo-lanterne-1/
```

```html
<div id="event_14409" class="eventon_list_event evo_eventtop  event" data-event_id="14409" data-time="1656925200-1661526000" data-colr="#fcc875" itemscope itemtype="http://schema.org/Event" 1>
	…
</div>
```

## ~~JSON-LD~~

### ~~Catalog~~

* incudes only highlighted events
* **malformed string literals** (see `description`)

```http
GET https://www.ghislieri.it/calendario-eventi/
```

```json
{	"@context": "http://schema.org",

    "@type": "Event",

    "name": "Bando di ammissione al Collegio Ghislieri",

    "startDate": "2022-7-4T09-09-00-00",

    "endDate": "2022-8-26T15-15-00-00",

    "image":"https://www.ghislieri.it/wp-content/uploads/2022/06/image-600x389.png",

    "description":"Concorso di ammissione al Collegio Ghislieri
    a.a. 2022-2023
    BANDO E MODULI
    Per accedere al Collegio Ghislieri occorre superare un concorso pubblico, basato sulla valutazione di due prove orali organizzate dal Collegio",

    "location":{

        "@type":"Place",

        "name":"Collegio Ghislieri",

        "address":"Piazza Ghislieri, 5"

    }

}
```

### ~~Details~~

* no `schema:Event` description

```http
GET https://www.ghislieri.it/evento/ciclo-lanterne-1/
```

```json
{
    "@context": "http://schema.org",
    "@graph": [
        {
            "@type": "WebSite",
            "@id": "https://www.ghislieri.it/#website",
            "url": "https://www.ghislieri.it/",
            "name": "Fondazione Ghislieri",
            "description": "Pavia",
            "potentialAction": [
                {
                    "@type": "SearchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": "https://www.ghislieri.it/?s={search_term_string}"
                    },
                    "query-input": "required name=search_term_string"
                }
            ],
            "inLanguage": "it-IT"
        },
        {
            "@type": "ImageObject",
            "inLanguage": "it-IT",
            "@id": "https://www.ghislieri.it/evento/ciclo-lanterne-1/#primaryimage",
            "url": "https://www.ghislieri.it/wp-content/uploads/2022/01/Loc-Lanterne-1-1.jpg",
            "contentUrl": "https://www.ghislieri.it/wp-content/uploads/2022/01/Loc-Lanterne-1-1.jpg",
            "width": 573,
            "height": 807
        },
        {
            "@type": "WebPage",
            "@id": "https://www.ghislieri.it/evento/ciclo-lanterne-1/",
            "url": "https://www.ghislieri.it/evento/ciclo-lanterne-1/",
            "name": "“COME BATTEREMO IL CANCRO”. PRESENTAZIONE DEL VOLUME DI FABIO CICERI E PAOLA AROSIO - Fondazione Ghislieri",
            "isPartOf": {
                "@id": "https://www.ghislieri.it/#website"
            },
            "primaryImageOfPage": {
                "@id": "https://www.ghislieri.it/evento/ciclo-lanterne-1/#primaryimage"
            },
            "image": {
                "@id": "https://www.ghislieri.it/evento/ciclo-lanterne-1/#primaryimage"
            },
            "thumbnailUrl": "https://www.ghislieri.it/wp-content/uploads/2022/01/Loc-Lanterne-1-1.jpg",
            "datePublished": "2022-01-22T09:36:34+00:00",
            "dateModified": "2022-01-25T11:27:20+00:00",
            "description": "Fabio Ciceri e Paola Arosio al Collegio Ghislieri di Pavia giovedì 3 febbraio 2022 alle ore 18",
            "breadcrumb": {
                "@id": "https://www.ghislieri.it/evento/ciclo-lanterne-1/#breadcrumb"
            },
            "inLanguage": "it-IT",
            "potentialAction": [
                {
                    "@type": "ReadAction",
                    "target": [
                        "https://www.ghislieri.it/evento/ciclo-lanterne-1/"
                    ]
                }
            ]
        },
        {
            "@type": "BreadcrumbList",
            "@id": "https://www.ghislieri.it/evento/ciclo-lanterne-1/#breadcrumb",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://www.ghislieri.it/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "eventi",
                    "item": "https://www.ghislieri.it/evento/"
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": "“COME BATTEREMO IL CANCRO”. PRESENTAZIONE DEL VOLUME DI FABIO CICERI E PAOLA AROSIO"
                }
            ]
        }
    ]
}
```

## ~~RSS~~

* generic news feed; apparently no event

```http
GET https://www.ghislieri.it/feed/
```
