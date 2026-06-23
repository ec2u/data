---
title: Jena › Offerings
summary: Integration status for Jena offerings
description: Integration status for the Jena university offerings dataset.
university: Jena
dataset: Offerings
status: active
version: 2023-03-02
---

Authoritative integration status for the Jena offerings dataset.

# 2023-03-02 – Site scraping

Program catalog scraped from the main site page; program details from page-level metadata.

- program catalog
  - scraped from main site page
- program details
  - page-level JSON-LD + **scheme:AboutPage** metadata
  - no detailed **schema:EducationalOccupationalProgram** description

| Source                         | Notes |
|--------------------------------|-------|
| [study programme][study-prog]  |       |

- **2024-04-03** – fix root XPath crawling expression
- **2023-03-02** – initial integration

[study-prog]: https://www.uni-jena.de/en/study-programme
