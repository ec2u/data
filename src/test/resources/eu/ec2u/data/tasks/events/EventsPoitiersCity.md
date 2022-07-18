# Site

* https://www.poitiers.fr/
  * https://www.poitiers.fr/les-evenements
  * Ville de Poitiers / Evenements
  * City of Poitiers / Events

# API

```xml

<meta name="Generator" content="Drupal 9 (https://www.drupal.org)"/>
```

* no structured feed
  * must be scraped

* ~~RSS~~ (disappearead after site upgrade on 2022-06)
  * https://www.poitiers.fr/rss/rss_agenda_mobile_.xml
  * other RSS feeds linked from the home page

- ~~RSS~~
  - mentioned by site header at https://www.poitiers.fr/c__2_266__Flux_RSS.html
  - the relevant link at https://www.poitiers.fr/rss/rss_agenda.xml is 404

# Integration

## Pending

* custom scrapimg crawler

## 2022-07-01

* disabled after site upgrade on 2022-06

## 2022-05-26

* initial integration

# Content

* ~~`schema:url`~~
* ~~`schema:name`~~
* ~~`schema:image`~~
* ~~`schema:description`~~
* ~~`schema:startDate`~~
* ~~`schema:endDate`~~
* ~~`dct:subject`~~

# Samples

## Catalog

```http
GET https://www.poitiers.fr/les-evenements?date=personnalise&du=2022-07-01&au=
```

```xml

<a href="/evenements/spectacle-flamenco" class="pushEvt__link">Spectacle Flamenco</a>
```

## Details

```http
GET https://www.poitiers.fr/evenements/spectacle-flamenco
```

```xml

```

