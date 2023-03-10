# Sites

* https://guias.usal.es/

# Integration

* data extracted from a set of dedicated REST/JSON APIs

## 2023-03-02

* integrate programs and programs-courses APIs

## 2023-01-17

* Integrate `schema:timeRequired`

## 2023-01-12

* Initial integration

# Feeds

## REST/JSON API

### Programs

```http
GET {{courses-salamanca-programs-url}}
Accept: application/json
```

```json
[
    {
        "programCode": "200",
        "programName": "GRADO EN INFORMACIÓN Y DOCUMENTACIÓN",
        "programUrl": "https://www.usal.es/node/474"
    },
    {
        "programCode": "201",
        "programName": "GRADO EN FARMACIA",
        "programUrl": "https://www.usal.es/node/473"
    },
    {
        "programCode": "202",
        "programName": "GRADO EN MATEMÁTICAS",
        "programUrl": "https://www.usal.es/node/467"
    }
    …
]
```

### Courses

```http
GET {{courses-salamanca-courses-url}}
Accept: application/json
```

```json
[
    {
        "code": "100000",
        "nameInSpanish": "HISTORIA DEL LIBRO",
        "nameInEnglish": "HISTORY OF THE BOOK",
        "ects": "6.00",
        "url": "https://guias.usal.es/node/406",
        "field_guias_asig_tdu_value": "S",
        "field_guias_asig_tqu_value": "EST",
        "field_guias_asig_cred_teor_value": null,
        "field_guias_asig_cred_prac_value": null
    },
    {
        "code": "100001",
        "nameInSpanish": "INGLÉS ESPECIALIZADO EN INFORMACIÓN Y DOCUMENTACIÓN",
        "nameInEnglish": "SPECIALISED ENGLISH FOR INFORMATION & DOCMENTATION",
        "ects": "6.00",
        "url": "https://guias.usal.es/node/407",
        "field_guias_asig_tdu_value": "S",
        "field_guias_asig_tqu_value": "EST",
        "field_guias_asig_cred_teor_value": null,
        "field_guias_asig_cred_prac_value": null
    },
    {
        "code": "100002",
        "nameInSpanish": "SOCIOLOGÍA DE LA INFORMACIÓN Y LA CULTURA",
        "nameInEnglish": "Sociology of Information and Culture",
        "ects": "6.00",
        "url": "https://guias.usal.es/node/408",
        "field_guias_asig_tdu_value": "S",
        "field_guias_asig_tqu_value": "EST",
        "field_guias_asig_cred_teor_value": null,
        "field_guias_asig_cred_prac_value": null
    },
    …
]
```

### Program/Course

```http
GET {{courses-salamanca-programs-courses-url}}
Accept: application/json
```

```json
[
    {
        "code": "100103",
        "programCode": "201"
    },
    {
        "code": "100107",
        "programCode": "201"
    },
    {
        "code": "100106",
        "programCode": "201"
    }
    …
]
```

###  