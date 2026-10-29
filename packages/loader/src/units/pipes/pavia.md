---
title: Units › Pavia
summary: Integration status for the Pavia University research units
description: Integration status for the research units of Pavia University, current and superseded source versions.
status: active
---

Authoritative integration status for the Pavia University research units.

# 2024-11-11 – LLM extraction

Unit homepages are listed by the university's research structure catalogues, each a plain list of links, then every
homepage is read and its unit extracted by AI, and stated one at a time, so an interrupted run keeps the units it
stated and the next one carries on. A homepage whose content is unchanged since its unit was stated is skipped before
extraction, so a quiet day costs a fetch per page and no model call. A crawl naming fewer than three quarters of the
stored units retracts nothing and fails the run, so a broken catalogue costs a run rather than the units it lists.

| Source                                                                                                           | Description                    |
|------------------------------------------------------------------------------------------------------------------|--------------------------------|
| https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti                                            | departments [it]               |
| https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-servizio-dateneo            | service centres [it]           |
| https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-ricerca-interdipartimentali | interdepartmental centres [it] |

The crawl reads the list items of the `field--name-field-testo-paragrafo` text blocks of each catalogue, which leaves
out the regulation and reading-aid links around them, and drops links to PDF documents, such as the LENA regulation
listed among the service centres. Each linked homepage, mostly a department or centre site of its own, is a unit,
keyed by its address and linked as its homepage; its main content is handed to the model, which states the official
name, the acronym where the page defines one and the description in the language of the page, translated to English
where it isn't English. A page that fails to be read stays in the crawl, so its unit is not retracted. Every unit
stands directly under the university and is classified against the EC2U organisation taxonomy and EuroSciVoc from its
page, where the legacy loader assigned every unit of a catalogue the fixed type of that catalogue.

- **2026-10-28** – ported to the TypeScript loader: catalogue links read through a fixed selector instead of listed by
	AI, unchanged homepages skipped before extraction, names and descriptions translated to English, types classified
- **2024-11-11** – initial integration
