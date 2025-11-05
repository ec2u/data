# Sources

- https://www.jku.at/en/degree-programs/academic-degree-programs/all-degree-programs/
- https://www.jku.at/en/degree-programs/international-students/exchange-students/courses/

# Integration

- data extracted from dedicated REST/JSON APIs

## 2025-04-28

- Update courses pipeline to read `educationalLevel` directly from the course description

## 2025-03-24

- Initial integration

# Feeds

## REST/JSON Programs API

```http
POST {{programs-linz-url}}
Accept: application/json
```

```json
[
  {
    "numberOfCredits": 180.0,
    "educationalLevel": "https://data.ec2u.eu/concepts/isced-2011/8",
    "url": [
      "https://www.jku.at/studium/studienarten/doktoratphd/"
    ],
    "identifier": [
      "794/056"
    ],
    "name": {
      "de": "Education"
    },
    "description": {
      "de": "Das Doktoratsstudium Doctor of Philosophy in Education (kurz: PhD in Education) …"
    }
  },
  …
]
```

## REST/JSON Courses API

```http
POST {{courses-linz-url}}
Accept: application/json
```

```json
[
  {
    "courseCode": "491ESYNPCHP19",
    "inProgram": [
      {
        "numberOfCredits": 120.0,
        "educationalLevel": "https://data.ec2u.eu/concepts/isced-2011/7",
        "url": [
          "https://www.jku.at/studium/studienarten/master/"
        ],
        "identifier": [
          "066/491"
        ],
        "name": {
          "de": "Chemistry and Chemical Technology"
        },
        "description": {
          "de": "(1) The English-language Master’s program in \"\"Chemistry and Chemical Technology\"\" at the Faculty…"
        }
      }
    ],
    "numberOfCredits": 2.0,
    "educationalLevel": "https://data.ec2u.eu/concepts/isced-2011/7",
    "url": [
      "https://studienhandbuch.jku.at/detail.php?lang=en&klaId=491ESYNPCHP19"
    ],
    "identifier": [
      "491ESYNPCHP19"
    ],
    "name": {
      "de": "Practical Photochemistry PR",
      "en": "Practical Photochemistry PR"
    }
  },
  …
]
```

