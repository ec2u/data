# Sites

* none

# Integration

* Dedicated REST/JSON API

-  `schema:educationalLevel` according to the following ISCED-2011 mapping

| Niveau | ISCED Level | ISCED Label               |
| ------ | ----------- | ------------------------- |
| L1     | 6           | Bachelor's or  equivalent |
| L2     | 6           | Bachelor's or  equivalent |
| L3     | 6           | Bachelor's or  equivalent |
| M1     | 7           | Master's or  equivalent   |
| M2     | 7           | Master's or  equivalent   |
| D      | 8           | Doctorate or  equivalent  |
| X0     | 9           | Not elsewhere classified  |
| X1     | 9           | Not elsewhere classified  |

## 2022-10-21

* initial integration

# Feeds

## REST/JSON API

| Field         | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| CodeEtape     | an identifier                                                |
| niveau        | an identifier of the level of the course (L1 to L3 for “licence” year one to 3; M1/M2 for Master; D for some researcher habilitation of for some medical formation; X0 and X1 regroup mainly identifier for students not register in a course, or doing international exchange) |
| nom           | the name of the course                                       |
| composante    | the faculty providing the course                             |
| entiteParente | identifier of the `composante`                               |

```http

```

```json

```