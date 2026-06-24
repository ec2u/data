---
title: Offerings › Jena
summary: Integration status for Jena offerings
description: Integration status for the Jena university offerings dataset.
status: active
---

Authoritative integration status for the Jena offerings dataset.

# 2023-03-02 – Site scraping

Programme catalogue scraped from the site Studienangebot page; programme details from page-level metadata.

- programme catalogue
	- scraped from the German Studienangebot page (268 programmes)
- programme details
	- page-level JSON-LD + **schema:AboutPage** metadata (`headline`, `abstract`)
	- no detailed **schema:EducationalOccupationalProgram** description
	- `educationalLevel` inferred from the slug degree (Bachelor → ISCED 6; Master/Staatsexamen/Diplom/Lehramt → 7;
	  supplementary/certificate unset)
	- `name` qualified with the slug-derived degree (e.g. `Arabistik – M.A.`) to keep same-subject programmes distinct
	- `educationalCredentialAwarded` set from the same slug-derived degree
- identifiers
	- minted from the language-neutral numeric page code (stable across the English and German catalogues)

| Source                                      | Description          |
|---------------------------------------------|----------------------|
| https://www.uni-jena.de/3860/studienangebot | study programme [de] |

- **2026-06-24** – migration to the German catalogue:
	- switch source to the German Studienangebot (268 programmes vs 223 English)
	- mint language-neutral IRIs from the numeric page code
	- qualify names with the slug-derived degree
	- set `educationalCredentialAwarded` from the slug-derived degree
	- infer `educationalLevel` (ISCED 2011) from the slug degree
- **2024-04-03** – fix root XPath crawling expression
- **2023-03-02** – initial integration
