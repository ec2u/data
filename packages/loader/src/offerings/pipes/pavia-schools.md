---
title: Offerings › Pavia › Specialisation Schools
summary: Integration status for the Pavia University medical specialisation schools
description: Integration status for the medical specialisation schools listed by Pavia University.
status: active
---

Authoritative integration status for the medical specialisation schools listed by Pavia University.

# 2024-11-07 – Listing pages

Schools described on the two listing pages of medical specialisation schools, for medical and for non-medical
graduates, each read whole by model and its schools stated one at a time as programs, unchanged ones skipped. A listing
page that fails to load or to be read fails the run before anything is stated, so its schools are never retracted on
the strength of a failed request, and a run naming fewer than three quarters of the stored schools retracts nothing.

| Source                                                      | Description             | Notes                                     |
|-------------------------------------------------------------|-------------------------|-------------------------------------------|
| [portale.unipv.it/it/…/laureati-medici][spec-medici]        | medics schools [it]     | schools for medical graduates             |
| [portale.unipv.it/it/…/laureati-non-medici][spec-non-medici] | non-medics schools [it] | schools for non-medical graduates         |

Schools have no pages of their own: each is keyed and named in Italian as `Scuola di Specializzazione in` its listed
name, stated at ISCED 2011 level 8 and awarding the `Diploma di Specializzazione` degree, with the summary, contents,
learning outcomes, admission and completion requirements the listing states, then translated to English and classified
as needed. The listing pages state no academic year: schools are dated with the academic year current at retrieval,
switching in August. Both pages are read by model on every run.

- **2026-10-29** – ported to the TypeScript loader: schools stated one at a time with unchanged ones skipped and a
	retraction floor; a listing page failing to load or to be read fails the run before anything is stated
- **2026-07-21** – extract goals, structure and contents for `schema:teaches` and graduation requirements for
  `schema:competencyRequired` from the specialisation-school pages
- **2024-11-07** – initial integration

[spec-medici]: https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-medici

[spec-non-medici]: https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-non-medici
