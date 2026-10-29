---
title: Offerings › Jena
summary: Integration status for the Jena University degree programs
description: Integration status for the degree programs listed by the University of Jena study programme catalogue.
status: active
---

Authoritative integration status for the University of Jena degree programs.

# 2023-03-02 – Site scraping

Program catalog scraped from the study programme page; program details read from the structured data each program page
embeds, then stated one at a time, so an interrupted run keeps the programs it stated and the next one carries on;
unchanged programs are skipped. A listed page that fails to load fails the run before anything is stated, and a run
naming fewer than three quarters of the stored programs retracts nothing and fails.

| Source                                     | Description          |
|--------------------------------------------|----------------------|
| https://www.uni-jena.de/en/study-programme | study programme [en] |

The catalogue links each program page from its filterable list (`//li[@data-filter]/a/@href`); each page embeds its
facts as a schema.org `AboutPage` in JSON-LD. A program is keyed by the page address the catalogue links, named by the
`headline` and described by the `abstract` in the `inLanguage` language, English by default; `educationalLevel`, a
degree name such as `Master of Science`, is stated as the degree awarded and mapped to an ISCED 2011 level where known,
the classification filling it in otherwise. The pages carry no richer `EducationalOccupationalProgram` description, and
`educationalLevel` is mostly empty. Pages state no academic year: programs are dated with the academic year current at
retrieval, switching in August, while terms are left unstated.

- **2026-10-29** – ported to the TypeScript loader: programs stated one at a time with unchanged ones skipped and a
	retraction floor; a listed page failing to load fails the run; embedded JSON-LD read as plain JSON
- **2024-04-03** – fix root XPath crawling expression
- **2023-03-02** – initial integration
