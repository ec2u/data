# Sites

* https://usal.es/institutos-investigacion
* https://investigacion.usal.es/es/empresas/gir

# Integration

* general research unit data extracted from dedicated REST/JSON API
* research unit ‹› virtual institute associations extracted from manually curated Google Sheet

## Pending

* waiting for API extensions
    * research centres
    * description
    * extended contact data

## 2022-10-20

* automated ingestion of research unit ‹› virtual institute associations

## 2022-10-06

* extract institute data
* add branch/RIS3 classification
* add homepage link
* add virtual institute membership

## 2022-09-26

* extract department data

## 2022-09-23

* add `org:classification` data

## 2022-09-07

* initial integration from REST/JSON API

# Feeds

## REST/JSON API

* based on the same database feeding https://investigacion.usal.es/GIR

```http
GET {{units-salamanca-url}}
Authorization: Basic {{units-salamanca-key}}
```

```json
[
  {
    "id": "203",
    "name": ". Aproximación a una teoría de la traducción literaria a través de su didáctica",
    "knowledge_branch": "Arte y Humanidades",
    "RIS3": "Patrimonio Natural, Patrimonio Cultural y Lengua Española",
    "acronym": "TRADLIT",
    "group_scientific_portal_url": "https:\/\/produccioncientifica.usal.es\/grupos\/3748\/detalle",
    "department": "Traducción e Interpretación",
    "department_web_usal_url": "https:\/\/www.usal.es\/departamento-de-traduccion-e-interpretacion",
    "department_scientific_portal_url": "https:\/\/produccioncientifica.usal.es\/grupos\/unidades\/1857\/listado",
    "institute": "",
    "institute_webusal_url": "",
    "topics": "- Traducción literatia\n- Didactica de la Traduccion",
    "head": "Santana López, María Belén"
  },
  {
    "id": "324",
    "name": "ADQUISICIÓN,DESARROLLO Y DIDÁCTICA DE LENGUAS MATERNAS(ADLEMA)",
    "knowledge_branch": "Arte y Humanidades",
    "RIS3": "Patrimonio Natural, Patrimonio Cultural y Lengua Española",
    "acronym": "ADLEMA",
    "group_scientific_portal_url": "https:\/\/produccioncientifica.usal.es\/grupos\/8154\/detalle",
    "department": "Lengua Española",
    "department_web_usal_url": "https:\/\/www.usal.es\/departamento-de-lengua-espanola",
    "department_scientific_portal_url": "https:\/\/produccioncientifica.usal.es\/grupos\/unidades\/1875\/listado",
    "institute": "",
    "institute_webusal_url": "",
    "topics": "- Adquisición de la lengua materna\r\n- Lingüística aplicada\r\n- Enseñanza de la lengua materna: lengua oral y escrita\r\n- Lingüística clínica: desarrollo atípico del lenguaje y déficits comunicativos",
    "head": "Martín Vegas, Rosa Ana"
  },
  {
    "id": "322",
    "name": "ALCOHOL, METABOLISMO Y SISTEMA INMUNE",
    "knowledge_branch": "Ciencias de la Salud",
    "RIS3": "Salud, Atención Social, Cambio Demográfico y Bienestar",
    "acronym": null,
    "group_scientific_portal_url": "https:\/\/produccioncientifica.usal.es\/grupos\/8152\/detalle",
    "department": "Medicina",
    "department_web_usal_url": "https:\/\/www.usal.es\/departamento-de-medicina",
    "department_scientific_portal_url": "https:\/\/produccioncientifica.usal.es\/grupos\/unidades\/1841\/listado",
    "institute": "Instituto de Investigación Biomédica de Salamanca (IBSAL)",
    "institute_webusal_url": "https:\/\/usal.es\/instituto-de-investigacion-biomedica-de-salamanca-ibsal",
    "topics": "- Genética de los trastornos relacionados con el consumo excesivo de alcohol\r\n- Alteración en la respuesta inmune tras el consumo de alcohol\r\n- Obesidad, esteatosis hepática e inflamación\r\n- Sepsis, bacteriemia e infección nosocomial\r\n- Genética de las enfermedades autoinmunes sistémicas\r\n",
    "head": "Marcos Martín, Miguel"
  }
  …
]
```

## ~~RSS Feeds~~

- https://usal.es/rss/institutos-investigacion
- https://usal.es/rss/centros-propios

## ~~Microdata~~

* no annotations, but USAL available to add if required and under guidance
