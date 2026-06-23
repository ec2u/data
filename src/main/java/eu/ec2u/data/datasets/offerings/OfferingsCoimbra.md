---
title: Coimbra › Offerings
summary: Integration status for Coimbra offerings
description: Integration status for the Coimbra university offerings dataset.
university: Coimbra
dataset: Offerings
status: active
version: 2022-09-27
---

Authoritative integration status for the Coimbra offerings dataset.

# 2022-09-27 – REST/JSON API

Data extracted from a dedicated REST/JSON API.

| Source                       | Notes |
|------------------------------|-------|
| [courses API][courses-api]   |       |

- **2024-05-03** – ingest offerings identifiers
- **2023-03-07** – classify entries as programs/courses according to the `cicloTipo` field:
  - `PRIMEIRO`/`SEGUNDO`/`TERCEIRO` ›› degree programs
  - `NAO_CONFERENTE_GRAU` ›› courses
- **2023-01-17** – integrate `schema:inLanguage`
- **2023-01-12** – add parameters to exclude non-current courses and integrate additional data
  - add additional parameters to exclude non-current courses
    (`obterInformacaoFichaCurso`/`devolverSoCursosComFichaCurso`)
  - select academic year dynamically on the current date
  - integrate additional data
    - `schema:learningResourceType`
    - `schema:numberOfCredits`
    - `schema:timeRequired`
    - `schema:teaches`
    - `schema:assesses`
    - `schema:coursePrerequisites`
    - `schema:competencyRequired`
    - `schema:educationalCredentialAwarded`
- **2022-10-07** – add `schema:educationalLevel` according to the following ISCED-2011 mapping
  - | Course Cycle Code (cicloTipo) | Course Category Code (categoriaCursoTipo) | ISCED Level | ISCED Label              |
    |-------------------------------|-------------------------------------------|-------------|--------------------------|
    | SEGUNDO                       | INTEGRADO                                 | 7           | Master's or equivalent   |
    | SEGUNDO                       | CONTINUIDADE                              | 7           | Master's or equivalent   |
    | SEGUNDO                       | ESPECIALIZACAO_AVANCADA                   | 7           | Master's or equivalent   |
    | SEGUNDO                       | FORMACAO_LONGO_VIDA                       | 7           | Master's or equivalent   |
    | NAO_CONFERENTE_GRAU           | POS_DOUTORAMENTO                          | 9           | Not elsewhere classified |
    | NAO_CONFERENTE_GRAU           | ESPECIALIZACAO                            | 9           | Not elsewhere classified |
    | NAO_CONFERENTE_GRAU           | FORMACAO                                  | 9           | Not elsewhere classified |
    | NAO_CONFERENTE_GRAU           | FORMACAO_CONTINUA                         | 9           | Not elsewhere classified |
    | NAO_CONFERENTE_GRAU           | ESPECIALIZACAO_AVANCADA                   | 9           | Not elsewhere classified |
    | PRIMEIRO                      |                                           | 6           | Bachelor's or equivalent |
    | TERCEIRO                      |                                           | 8           | Doctorate or equivalent  |
- **2022-09-27** – initial integration

[courses-api]: https://apps.uc.pt/courses/
