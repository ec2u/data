# Sites

*  https://guias.usal.es/

# Integration

* data extracted from dedicated REST/JSON API

## 2023-01-12

* Initial integration

# Feeds

## REST/JSON API

```http
GET {{courses-salamanca-url}}
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