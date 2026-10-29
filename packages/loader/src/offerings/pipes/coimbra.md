---
title: Offerings › Coimbra
summary: Integration status for the Coimbra University programs and courses
description: Integration status for the degree programs and courses listed by the University of Coimbra.
status: active
---

Authoritative integration status for the University of Coimbra programs and courses.

# 2022-09-27 – REST/JSON API

Programs and courses are drawn from a dedicated REST/JSON API and stated one at a time, so an interrupted run keeps the
offerings it stated and the next one carries on; unchanged records are skipped. A run naming fewer than three quarters
of the stored offerings retracts nothing and fails, so a failed or rejected request costs a run rather than the
catalogue, and pruning below that share requires a forced reload, once the withdrawal is confirmed with the university.

| Source                      | Description      | Notes                                                                                                     |
|-----------------------------|------------------|-----------------------------------------------------------------------------------------------------------|
| https://apps.uc.pt/courses/ | courses API [pt] | `obtemCursosBloco` form post; URL and credentials held in GCP Secret Manager as `offerings-coimbra-{url,id,token}` |

The API answers for one academic year per request, whatever the number of `anoLectivo` values posted, and its records
state no year of their own: the pipe asks for the academic year current at retrieval, switching in August, and states
every offering in it, while terms are left unstated. Only offerings with a course sheet in that year
are listed (`obterInformacaoFichaCurso`, `devolverSoCursosComFichaCurso`). A record is a degree program unless its
`cicloTipo` is `NAO_CONFERENTE_GRAU`, which marks a course awarding no degree; either is keyed by its `cursoId`.

| Cycle (`cicloTipo`)   | Category (`categoriaCursoTipo`)                                                         | ISCED 2011 level |
|-----------------------|-----------------------------------------------------------------------------------------|------------------|
| `PRIMEIRO`            | any                                                                                     | 6                |
| `SEGUNDO`             | `INTEGRADO`, `CONTINUIDADE`, `ESPECIALIZACAO_AVANCADA`, `FORMACAO_LONGO_VIDA`           | 7                |
| `TERCEIRO`            | any                                                                                     | 8                |
| `NAO_CONFERENTE_GRAU` | `POS_DOUTORAMENTO`, `ESPECIALIZACAO`, `FORMACAO`, `FORMACAO_CONTINUA`, `ESPECIALIZACAO_AVANCADA` | 9      |

`duracaoEN` is read as the time a program takes to complete, in years, semesters, trimesters, months, weeks or days,
and as the time a course requires, in days or hours, decimal hours included. The teaching languages of a course are
read from the English names `linguasAprendizagem` states, the words naming no language being ignored.

- **2026-10-29** – ported to the TypeScript loader: offerings stated one at a time with unchanged records skipped and a
	retraction floor; the academic year requested and stated is the one current at retrieval, switching in August, as
	the API answers for the first year posted only; ISCED levels mapped for every category in the table above
- **2026-07-17** – map academic year (`ec2u:year`) from the request filter, stamping the current academic year on all
	courses (the API exposes no per-course year or term)
- **2024-05-03** – ingest offerings identifiers
- **2023-03-07** – classify entries as programs/courses according to the `cicloTipo` field:
	- `PRIMEIRO`/`SEGUNDO`/`TERCEIRO` ›› degree programs
	- `NAO_CONFERENTE_GRAU` ›› courses
- **2023-01-17** – integrate `schema:inLanguage`
- **2023-01-12** – add parameters to exclude non-current courses and integrate additional data
- **2022-10-07** – add `schema:educationalLevel` according to an ISCED 2011 mapping of cycle and category codes
- **2022-09-27** – initial integration
