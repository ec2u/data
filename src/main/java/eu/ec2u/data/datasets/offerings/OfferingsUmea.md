# Sources

- https://www.umu.se/utbildning/valj-utbildning/program-och-kurser/

# Integration

- Offerings data retrieved from undocumented REST/JSON search API supporting the search UI
- Offering info extracted by LLM from linked pages

## 2025-11-05

- migrated from paginated HTML scraping to REST/JSON API (website now uses Vue.js SPA with dynamic content)
- initial implementation used sitemap-based discovery, then migrated to direct API access

## 2025-05-29

- initial integration

# Feeds

## REST/JSON Programs API

```http
POST {{offerings-umea-url}}
Content-Type: application/json
Accept: application/json
```

Request:

```json
{
  "Query": "",
  "Skip": "0",
  "Take": "200",
  "QueryPrefix": "hepp",
  "Filters": [
    {
      "Type": 2,
      "Value": "1305560umucms,1305559umucms"
    },
    {
      "Type": 5,
      "Name": "contentlabel",
      "Value": "program"
    }
  ]
}
```

Response:

```json
{
  "totalMatching":
  …,
  "hits": [
    {
      "id": "1308605svumucms",
      "title": "Apotekarprogrammet",
      "url": "https://www.umu.se/utbildning/program/apotekarprogrammet",
      "typeName": "cms.models.blocks.utbildning.programblock",
      "eduCode": "NGAPO",
      "eduLevel": "Grundnivå",
      "credits": "300 hp",
      "studieort": "Ortsoberoende",
      "studietakt": "5 år (helfart)",
      "studieform": "Distans med obligatoriska träffar",
      "subjects": "Biomedicin, Farmaci, Läkemedelskemi, Medicin",
      "orgtags": [
        {
          "id": 74315,
          "text": "Kemiska institutionen",
          "kod": "kein0001"
        }
      ]
    }
    …
  ],
  "facets": {
    …
  }
}
```

## REST/JSON Courses API

```http
POST {{offerings-umea-url}}
Content-Type: application/json
Accept: application/json
```

Request:

```json
{
  "Query": "",
  "Skip": "0",
  "Take": "2000",
  "QueryPrefix": "hepp",
  "Filters": [
    {
      "Type": 2,
      "Value": "1305560umucms,1305559umucms"
    },
    {
      "Type": 5,
      "Name": "contentlabel",
      "Value": "kurs"
    }
  ]
}
```

Response:

```json
{
  "totalMatching":
  …,
  "hits": [
    {
      "id": "...",
      "title": "3D-modellering och siktanalys",
      "url": "https://www.umu.se/utbildning/kurser/3d-modellering-och-siktanalys-2kg605",
      "typeName": "cms.models.blocks.utbildning.kursblock",
      "eduCode": "2KG605",
      "credits": "7.5 hp",
      "subjects": "Informationsteknik, Samhällsplanering, Geografi och kulturgeografi"
    }
    …
  ],
  "facets": {
    …
  }
}
```
