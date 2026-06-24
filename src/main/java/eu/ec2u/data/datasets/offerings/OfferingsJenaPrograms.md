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

---

## Notes – planned switch to the German catalogue

The scraper currently reads the **English** catalogue (`/en/study-programme` = `/en/3860/degree-programmes`, 223
programmes). The **German** `/3860/studienangebot` is the authoritative superset (268): it adds ~45 German-only
programmes plus far more Erweiterungsprüfungen (41 vs 3) and Zertifikat entries (5 vs 1). It is the same catalogue
language-switched (page id `3860`), with untranslated entries dropped from the English view. German names also align
with Friedolin's `Studiengang` labels, which helps the guest-studies course reconciliation (see
[Offerings › Jena › Courses](OfferingsJenaCourses.md)).

**Decision:** move Programs harvesting to the German catalogue.

Prerequisites and caveats before switching:

- **Program identity (do first).** `id` is `uuid(JENA, url)` over the full localised URL, so changing `…/en/6120/…` to
  `…/6120/…` re-mints every Jena program IRI and breaks existing links and `hasCourse` references. Mint the id from the
  language-neutral numeric page id (e.g. `6120`) or the Friedolin `abschl_stg` code before the switch.
- **List selectors.** The current XPath `//li[@data-filter]/a/@href` is tuned to the English page; re-derive the link
  selector against the German listing markup.
- **`educationalLevel` mapping.** The `LEVELS` map keys are English degree strings; update them to the German labels
  ("Erste Staatsprüfung", "Magister", …) or rely on the `review()` ISCED AI fallback (which currently misclassifies
  unmapped degrees, often to ISCED level 0).
- **Translation is already handled.** `Program.review()` translates `name`/`description` to English, so storing the
  German originals is fine and yields the proper local-language label.

**Friedolin cross-walk.** Site programme pages link a module-catalogue PDF `…/modulkataloge/de/<abschl>_<stg>_…pdf`
(e.g. `68_272`), exposing Friedolin's `abschluss`/`studiengang` codes; this `stg` is the join key to the planned
guest-studies courses harvest.
