---
title: Offerings › Jena
summary: Integration status for Jena offerings
description: Integration status for the Jena university offerings dataset.
status: active
---

Authoritative integration status for the Jena offerings dataset.

# 2023-03-02 – Site scraping

Program catalog scraped from the main site page; program details from page-level metadata.

- program catalog
	- scraped from main site page
- program details
	- page-level JSON-LD + **scheme:AboutPage** metadata
	- no detailed **schema:EducationalOccupationalProgram** description

| Source                                     | Description          |
|--------------------------------------------|----------------------|
| https://www.uni-jena.de/en/study-programme | study programme [en] |

- **2024-04-03** – fix root XPath crawling expression
- **2023-03-02** – initial integration
