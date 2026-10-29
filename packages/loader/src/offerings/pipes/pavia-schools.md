---
title: Offerings › Pavia › Specialisation Schools
summary: Integration status for the Pavia University medical specialisation schools
description: Integration status for the medical specialisation schools listed by Pavia University.
status: active
---

Authoritative integration status for the medical specialisation schools listed by Pavia University. The most recent
version is listed first; superseded versions are kept below for reference, newest first.

# 2026-10-29 – Portal catalogue

Schools listed on the paged specialisation catalogue of the university portal, for medical and non-medical graduates
alike, each school page then read and its program extracted by model and stated one at a time, unchanged pages skipped.

| Source                                                    | Description                          | Notes                                                  |
|-----------------------------------------------------------|--------------------------------------|--------------------------------------------------------|
| [portale.unipv.it/it/…/offerta-didattica][spec-catalogue] | specialisation school catalogue [it] | paged as `?page=0…`; school cards linking school pages |

Every page the catalogue pager links to is read, and every card on it (`.card-corsi`) lists a school by name and links
its page. A school is keyed by its page address, which carries an edition suffix (`-0`, `-1`) telling apart schools
listed under the same name. It is named in Italian as `Scuola di Specializzazione in` its listed name, in sentence case
where the catalogue lists it in capitals, stated at ISCED 2011 level 8 and awarding the `Diploma di Specializzazione`
degree, with the duration the card states in years. Summary, contents, learning outcomes, admission and completion
requirements and credits are extracted from the school page, then translated to English and classified as needed. The
catalogue states no academic year: schools are dated with the academic year current at retrieval, switching in August.

A catalogue page that fails to load lists no school and is logged like any other failure. A run naming fewer than three
quarters of the stored schools retracts nothing and fails, so a failed page never retracts its schools.

- **2026-10-29** – initial integration, replacing the two listing pages retired with the portal overhaul

# 2024-11-07 – Listing pages

Schools described on the two listing pages of medical specialisation schools, for medical and for non-medical graduates,
each read whole by model and its schools stated one at a time as programs, unchanged ones skipped. A listing page that
fails to load or to be read is logged and lists no school, and a run naming fewer than three quarters of the stored
schools retracts nothing, so a failed request never retracts the schools of a page wholesale.

| Source                                                       | Description             | Notes                             |
|--------------------------------------------------------------|-------------------------|-----------------------------------|
| [portale.unipv.it/it/…/laureati-medici][spec-medici]         | medics schools [it]     | schools for medical graduates     |
| [portale.unipv.it/it/…/laureati-non-medici][spec-non-medici] | non-medics schools [it] | schools for non-medical graduates |

Schools had no pages of their own: each was keyed and named in Italian as `Scuola di Specializzazione in` its listed
name, stated at ISCED 2011 level 8 and awarding the `Diploma di Specializzazione` degree, with the summary, contents,
learning outcomes, admission and completion requirements the listing stated, read whole by model.

- **2026-10-29** – retired: the portal overhaul withdrew the listing for medical graduates, now answering `403`
- **2026-10-29** – ported to the TypeScript loader: schools stated one at a time with unchanged ones skipped and a
	retraction floor; a listing page failing to load or to be read is logged like any other failure
- **2026-07-21** – extract goals, structure and contents for `schema:teaches` and graduation requirements for
	`schema:competencyRequired` from the specialisation-school pages
- **2024-11-07** – initial integration

[spec-catalogue]: https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/offerta-didattica

[spec-medici]: https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-medici

[spec-non-medici]: https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-non-medici
