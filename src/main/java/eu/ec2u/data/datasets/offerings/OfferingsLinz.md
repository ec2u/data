# Sources

- https://www.jku.at/en/degree-programs/academic-degree-programs/all-degree-programs/
- https://www.jku.at/en/degree-programs/international-students/exchange-students/courses/

# Integration

- data extracted from dedicated REST/JSON APIs

## 2025-11-11

- Update courses pipeline to read `audience: "[Lifelong Learner"]` from the course description

## 2025-04-28

- Update courses pipeline to read `educationalLevel` directly from the course description

## 2025-03-24

- Initial integration

# Feeds

## REST/JSON Programs API

```http
GET {{programs-linz-url}}
Accept: application/json
```

```json
[
  {
    "numberOfCredits": 120.0,
    "educationalLevel": "https://data.ec2u.eu/concepts/isced-2011/7",
    "url": [
      "https://www.jku.at/studium/studienarten/master/"
    ],
    "identifier": [
      "066/977"
    ],
    "name": {
      "de": "Economic and Business Analytics"
    },
    "description": {
      "de": "(1) The Master's program in Economic and Business Analytics is an advanced academic and method-oriented program of education. It qualifies students to process and solve complex practice-oriented business and economic problems…",
    }
  }
  …
]
```

## REST/JSON Courses API

```http
GET {{courses-linz-url}}
Accept: application/json
```

```json
[
  {
    "courseCode": "990CEBCCUCK13",
    "inProgram": [
      {
        "numberOfCredits": 120.0,
        "educationalLevel": "https://data.ec2u.eu/concepts/isced-2011/7",
        "url": [
          "https://www.jku.at/studium/studienarten/master/"
        ],
        "identifier": [
          "066/990"
        ],
        "name": {
          "de": "JMP Global Business Russia/Italy"
        },
        "description": {
          "de": "(1) The inter-university Joint Master's Program \"\"Global Business\"\" is offered by the Johannes Kepler University Linz…"
        }
      }
    ],
    "numberOfCredits": 3.0,
    "educationalLevel": "https://data.ec2u.eu/concepts/isced-2011/7",
    "url": [
      "https://studienhandbuch.jku.at/detail.php?lang=en&klaId=990CEBCCUCK13"
    ],
    "identifier": [
      "990CEBCCUCK13"
    ],
    "name": {
      "de": "Cultural Context KS",
      "en": "Cultural Context KS"
    }
  },
  …
]
```
