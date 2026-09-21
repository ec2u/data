---
title: Offerings › Pavia
summary: Integration status for Pavia offerings
description: Integration status for the Pavia university offerings dataset.
status: active
---

Authoritative integration status for the Pavia offerings dataset.

# 2024-10-30 – ESSE3, UGov and LLM extraction

Undergraduate data from public ESSE3 and internal UGov APIs, linked to the public course catalogue; doctorate and
specialisation-school data extracted by LLM from program pages.

| Source                                                                     | Description             | Notes                                      |
|----------------------------------------------------------------------------|-------------------------|--------------------------------------------|
| https://studentionline.unipv.it/e3rest/api/offerta-service-v1              | ESSE3 API [it]          | undergraduate basic data                   |
| [studentionline.unipv.it/e3rest/docs/…][esse3-docs]                        | ESSE3 API docs [it]     | API documentation                          |
| internal UGov APIs                                                         | UGov API [it]           | undergraduate extended data; no public URL |
| https://unipv.coursecatalogue.cineca.it                                    | course catalogue [it]   | program and course page links              |
| https://phd.unipv.it/la-scuola-di-alta-formazione-dottorale-di-pavia-safd/ | doctoral school [it]    | doctorate programs (LLM)                   |
| [portale.unipv.it/it/…/laureati-medici][spec-medici]                       | medics schools [it]     | specialisation schools (LLM)               |
| [portale.unipv.it/it/…/laureati-non-medici][spec-non-medici]               | non-medics schools [it] | specialisation schools (LLM)               |

- **2026-09-21** – link programs and courses to their pages on the CINECA course catalogue, composing the address from
  codes the sources already carry and keeping it only once the catalogue confirms it; identify a course by program as
  well as by code, so that each entry stands for one published page, and qualify a course name with its program and a
  program name with its cohort where they would otherwise be ambiguous; map an activity listed under several
  regulations once, from the newest
- **2026-07-22** – switched doctorate crawling to incremental page keeping: pages are queued only when never fetched or
  older than 30 days, then processed in checkpointed batches within a per-run time budget, so a run resumes where the
  previous one stopped; pages dropped from the doctoral school index or unavailable after three consecutive attempts are
  retired together with the programs they generated
- **2026-07-21** – map the UGov `MOD_VER_APPR` text section to the examination requirements
  (`schema:competencyRequired`) and append `METODI_DID` and `TESTI_RIF` to the course contents (`schema:teaches`)
- **2026-07-21** – extract goals, structure and contents for `schema:teaches` and graduation requirements for
  `schema:competencyRequired` from the doctorate and specialisation-school pages
- **2026-07-17** – map academic year (`ec2u:year`) and term (`ec2u:term`) from the UGov `aaOffId` and `tipoCicloCod`
- **2024-11-07** – doctorate and specialisation schools integration
- **2024-10-31** – UGov integration
- **2024-10-30** – migration to ESSE3; initial integration

## Course Catalogue

The course catalogue is a multi-tenant service CINECA hosts for its member universities, one host per tenant, fed from
the same UGov records this integration already reads. The Pavia tenant answers at
https://unipv.coursecatalogue.cineca.it and identifies itself through `/api/v1/ateneo` as `ate_cod: unipv`. The
endpoints below are the catalogue application's own backend rather than a documented product API: unlike the ESSE3
service, they carry no published contract and may change without notice, so anything built on them is worth re-checking
after a catalogue release.

| Endpoint                             | Answers                                                                                |
|--------------------------------------|----------------------------------------------------------------------------------------|
| `GET /api/v1/ateneo`                 | tenant identity and display configuration                                              |
| `GET /api/v1/anni-offerta`           | the offer years the tenant publishes                                                   |
| `GET /api/v1/corsi?anno&minimal`     | the programs open to new enrolment in a year, keyed by `cdsCod`                        |
| `GET /api/v1/corso-code?anno&cdsCod` | a program by its ESSE3 code, 404 when that year publishes no page                      |
| `GET /api/v1/corso/{anno}/{cod}`     | a program by the catalogue's own identifier                                            |
| `GET /api/v1/corso-offerta/{cod}`    | a program's teaching, by cohort and teaching period                                    |
| `GET /api/v1/insegnamento-code?…`    | an activity by `aa_offerta`, `cod_af`, `aa_ordinamento`, `af_percorso` and `cod_corso` |
| `POST /api/v1/ricercaInsegnamenti`   | activity search, filtered by the search form's own names                               |

Pages are addressed by the same codes, so a link is composed rather than looked up:
`/corsi-code/{coorte}/{cdsCod}` for a program and
`/insegnamenti-code/{aa}/{adCod}/{ordAa}/{pdsCod}/{cdsCod}` for a course. Both are resolved client-side, so the page
itself always answers 200; the matching `corso-code` and `insegnamento-code` endpoints are what report whether a page
exists, and `HEAD` is honoured, which is how the harvester checks a link without transferring anything.

Three readings are not what they look like, each of them settled against a live response and each capable of yielding a
page that does not exist:

- the ordinamento year keying a course page comes from UGov `ns2:cdsordCod`, `01400-08` giving 2008, **not** from
  `ns2:aaRegdidId`, which carries the regulation year
- the track keying a course page is the program's (`corso_percorso_cod`), while UGov nests an activity under its own
  (`af_percorso_cod`); `00` marks an activity common to the whole program and resolves only under one of the program's
  real tracks
- a program page is served under the enrolment year of the most recent cohort still taught, which is the offer year only
  for programs still open to new enrolment

`ricercaInsegnamenti` takes the search form's control names, `anno_off`, `anno_imm`, `cdsCod`, `attive` among them, and
**ignores** an unrecognised key rather than rejecting it, so a plausible but wrong name such as `anno` silently returns
the whole archive, some 170 MB across ten academic years.

The reasoning behind the link composition, the coverage it reaches and the course identity it implies is recorded on
[ec2u/data#67](https://github.com/ec2u/data/issues/67).

[esse3-docs]: https://studentionline.unipv.it/e3rest/docs/?urls.primaryName=Offerta%20Api%20V1%20(https%3A%2F%2Fstudentionline.unipv.it%2Fe3rest%2Fapi%2Fofferta-service-v1)

[spec-medici]: https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-medici

[spec-non-medici]: https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-non-medici
