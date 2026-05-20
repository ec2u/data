# Sources

- https://www.utu.fi/event-search
  - University of Turku / News
  - Turun yliopisto / Ajankohtaista

# Integration

- Event info extracted by LLM from event catalog and linked event pages

## 2025-05-07

- migrated to LLM extraction

---

# Legacy

## API

- JSON
  - https://api-ext.utu.fi/events/v1/public
  - proxied version of the base IP-restricted API @ https://api.utu.fi/events/v1/public

## Integration

- custom adapter
- access key stored on GCP Secret Manager
- required contact address provided by MMT

## Pending

- review availability of image links

## 2022-06-07

- fix conflicting labels for online locations
  - generated when the same URL is used for multiple events, e.g. `https://utu.zoom.us/j/65956988902`

## Samples

```http
GET https://api-ext.utu.fi/events/v1/public
X-Api-Key: {{events-turku-university}}
```

```json
[
  {
    "id": 11097,
    "source_link": "https://konsta.utu.fi/fi-fi/Calendar/UTU-Tapahtumakalenteri/UTU-Tapahtumakalenteri-Sisäsivu/id/11097",
    "published": "2021-08-12 12:37:10.413",
    "updated": "2021-08-20 14:26:37.743",
    "type": [
      "20"
    ],
    "title": {
      "fi": "Väitös (filosofia): VTM, FM Tiia Sudenkaarne"
    },
    "location": {
      "free_text": "https://utu.zoom.us/j/61857174329",
      "full": "https://utu.zoom.us/j/61857174329",
      "url": "https://utu.zoom.us/j/61857174329"
    },
    "start_time": "2021-08-28 16:00:00",
    "end_time": "2021-08-28 18:00:00",
    "description": {
      "fi": "VTM, FM Tiia Sudenkaarne esittää väitöskirjansa ”Queering Bioethics: A Queer Feminist Framework for Vulnerability and Principles” julkisesti tarkastettavaksi Turun yliopistossa lauantaina 28.8.2021 klo 16.00. Väitöstilaisuutta voi seurata etänä.<br><br>Vastaväittäjänä toimii professori Jamie Nelson (Michigan State University, Yhdysvallat) ja kustoksena yliopistonlehtori Helena Siipi (Turun yliopisto). Tilaisuus on suomen- ja englanninkielinen. Väitöksen alana on filosofia.<br><br>Turun yliopisto seuraa aktiivisesti koronavirustilannetta ja viranomaisten ohjeita. Yliopisto päivittää ohjeitaan tilanteen mukaan. Ohjeet ja linkit löytyvät osoitteesta: utu.fi/koronavirus<br>"
    },
    "additional_information": {
      "link": {
        "url": "https://www.utu.fi/fi/ajankohtaista/vaitos/vaitostutkimus-sukupuolen-ja-seksuaalisuuden-moninaisuuden-filosofiasta",
        "title": {
          "fi": "Lue tiedote: Väitöstutkimus sukupuolen ja seksuaalisuuden moninaisuuden filosofiasta laajentaa käsitystämme hyvästä elämästä ja ihmisyydestä"
        }
      },
      "contact": {
        "name": "Viestintä",
        "email": "viestinta@utu.fi"
      }
    },
    "units": [
      {
        "oid": "1.2.246.10.2458963.20.61023440094",
        "code": "2601300",
        "title": {
          "fi": "viestintä"
        }
      }
    ],
    "publishing_locations_www": [
      {
        "code": 239,
        "label": {
          "fi": "Yhteiskuntatieteellinen tiedekunta",
          "en": "Faculty of Social Sciences"
        },
        "type": "WWW",
        "oid": "1.2.246.10.2458963.20.81527106298"
      },
      {
        "code": 245,
        "label": {
          "fi": "Etusivu",
          "en": "Frontpage"
        },
        "type": "WWW",
        "oid": "1.2.246.10.2458963.20.74546823415"
      }
    ],
    "publishing_locations_intranet": [
      {
        "code": 49,
        "label": {
          "fi": "Intranetin etusivu",
          "en": null
        },
        "type": "Intranet",
        "oid": "1.2.246.10.2458963.20.59341035976"
      },
      {
        "code": 64,
        "label": {
          "fi": "Turun yliopiston tutkijakoulu (UTUGS)",
          "en": "UTU Graduate School (UTUGS)"
        },
        "type": "Intranet",
        "oid": "1.2.246.10.2458963.20.20540543350"
      },
      {
        "code": 125,
        "label": {
          "fi": "Yhteiskuntatieteellinen tiedekunta",
          "en": "Faculty of Social Sciences"
        },
        "type": "Intranet",
        "oid": "1.2.246.10.2458963.20.81527106298"
      },
      {
        "code": 129,
        "label": {
          "fi": "Filosofian, poliittisen historian ja valtio-opin laitos ",
          "en": "Department of Philosophy, Political Science and Contemporary History"
        },
        "type": "Intranet",
        "oid": "1.2.246.10.2458963.20.60769906714"
      },
      {
        "code": 131,
        "label": {
          "fi": "Filosofia",
          "en": "Philosophy"
        },
        "type": "Intranet",
        "oid": "1.2.246.10.2458963.20.25750555531"
      }
    ]
  }
  …
]
```
