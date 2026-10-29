---
title: Offerings › Pavia › Doctorates
summary: Integration status for the Pavia University doctoral programs
description: Integration status for the doctoral programs listed by the Pavia University doctoral school.
status: active
---

Authoritative integration status for the doctoral programs listed by the Pavia University doctoral school.

# 2024-11-07 – Doctoral school pages

Doctorates listed on the doctoral school index page, read by model, each program page then read and its program
extracted by model and stated one at a time, so an interrupted run keeps the programs it stated and the next one
carries on; a page whose content is unchanged is fetched but not extracted again. A run naming fewer than three quarters
of the stored programs retracts nothing and fails, so an index that fails to load or to be read costs a run.

| Source                                                                     | Description          | Notes                          |
|----------------------------------------------------------------------------|----------------------|--------------------------------|
| https://phd.unipv.it/la-scuola-di-alta-formazione-dottorale-di-pavia-safd/ | doctoral school [it] | index of doctoral program pages |

The index lists each doctorate by name, linking its page: a program is keyed by its page address, named `Dottorato in`
or `Doctorate in` its listed name according to the language of the name, stated at ISCED 2011 level 8 and awarding the
`Dottorato di Ricerca` degree. Summary, description, contents, learning outcomes, admission and graduation requirements
and credits are extracted from the program page, then translated to English and classified as needed. Pages state no
academic year: programs are dated with the academic year current at retrieval, switching in August.
 A page that fails to load is skipped and stays listed, so it is never retracted for it.

- **2026-10-29** – ported to the TypeScript loader: pages are read on every run and extracted again only when their
	content changes, replacing the 30-day refresh and the per-run time budget; pages are retracted only once the index
	drops them, no longer after consecutive failures
- **2026-07-22** – switched doctorate crawling to incremental page keeping: pages are queued only when never fetched or
  older than 30 days, then processed in checkpointed batches within a per-run time budget, so a run resumes where the
  previous one stopped; pages dropped from the doctoral school index or unavailable after three consecutive attempts are
  retired together with the programs they generated
- **2026-07-21** – extract goals, structure and contents for `schema:teaches` and graduation requirements for
  `schema:competencyRequired` from the doctorate pages
- **2024-11-07** – initial integration
