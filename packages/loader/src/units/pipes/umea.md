---
title: Units › Umeå
summary: Integration status for the Umeå University research units
description: Integration status for the research units of Umeå University, current and superseded source versions.
status: active
---

Authoritative integration status for the Umeå University research units.

# 2025-05-28 – LLM extraction

Unit pages are found by crawling the university's organisation and research index pages along fixed XPath selectors,
then each page is read and its unit extracted by AI, and stated one at a time, so an interrupted run keeps the units it
stated and the next one carries on. A page whose content is unchanged since its unit was stated is skipped before
extraction, so a quiet day costs a fetch per page and no model call. A crawl naming fewer than three quarters of the
stored units retracts nothing and fails the run, so a broken index costs a run rather than the units it lists.

| Source                                                                                  | Description                                   |
|-----------------------------------------------------------------------------------------|-----------------------------------------------|
| https://www.umu.se/forskning/                                                           | research [sv]                                 |
| https://www.umu.se/om-umea-universitet/sa-ar-vi-organiserade/hela-organisationen/       | whole organisation [sv]                       |
| https://www.umu.se/om-umea-universitet/sa-ar-vi-organiserade/institutioner-och-enheter/ | departments, sections, units and offices [sv] |
| https://www.umu.se/om-umea-universitet/sa-ar-vi-organiserade/fakulteter-och-hogskolor/  | faculties, schools and institutes [sv]        |
| https://www.umu.se/om-umea-universitet/sa-ar-vi-organiserade/centrum/                   | research centres [sv]                         |
| https://www.umu.se/forskning/forskningsgrupper/                                         | research groups [sv]                          |
| https://www.umu.se/forskning/forskningsinfrastruktur/                                   | research infrastructure [sv]                  |

The crawl follows the links under the `maincontent` section of the organisation pages (only list items for faculties
and schools, only paragraph links for centres), the `navpuff` category tiles and then the `item` links of the research
group pages, and the `/forskning/infrastruktur/` links of the infrastructure page. External links are followed too,
as some centres keep their own sites. Each linked page is a unit, keyed by its address and linked as its homepage; its
main content is handed to the model, which states the official name, the acronym where the page defines one and the
description in the language of the page, translated to English where it isn't English. A page that fails to be read
stays in the crawl, so its unit is not retracted, and is left as it was until the page can be read again. Every unit
stands directly under the university and is classified against the EC2U organisation taxonomy and EuroSciVoc.

- **2026-10-28** – ported to the TypeScript loader: unchanged pages skipped before extraction, names and descriptions
	translated to English, types and subjects classified against the taxonomies, unreadable pages kept in the crawl
- **2025-05-28** – initial integration
