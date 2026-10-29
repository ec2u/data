---
title: Offerings › Pavia
summary: Integration status for the Pavia University programs and courses
description: Integration status for the degree programs and courses Pavia University offers through ESSE3 and UGov.
status: active
---

Authoritative integration status for the Pavia University programs and courses; doctorates and specialisation schools
are harvested by pipes of their own, each documented in its own integration notes.

# 2024-10-30 – ESSE3, UGov and course catalogue

Programs drawn from the public ESSE3 offer API and courses from the internal UGov teaching plan export, linked to the
public course catalogue and stated one at a time, so an interrupted run keeps the offerings it stated and the next one
carries on; unchanged ones are skipped. A run naming fewer than three quarters of the stored offerings retracts nothing
and fails, and a teaching plan that fails to load fails the run before anything is stated, so a failed request never
retracts the courses of its program on the strength of their absence from a scan that could not see them.

| Source                                                        | Description           | Notes                                                                  |
|---------------------------------------------------------------|-----------------------|------------------------------------------------------------------------|
| https://studentionline.unipv.it/e3rest/api/offerta-service-v1 | ESSE3 API [it]        | programs, read in pages of 100 until a short page                      |
| [studentionline.unipv.it/e3rest/docs/…][esse3-docs]           | ESSE3 API docs [it]   | API documentation                                                      |
| internal UGov APIs                                            | UGov API [it]         | teaching plans; endpoint and credentials held in GCP Secret Manager as `offerings-pavia-{url,usr,pwd}` |
| https://unipv.coursecatalogue.cineca.it                       | course catalogue [it] | program and course page links                                          |

Programs are those ESSE3 offers in the academic year current at retrieval, switching in August, keyed by `cdsCod` and
delivered in the year starting in their `aaOffId`; `tipoCorsoCod` is mapped to an ISCED 2011 level and the department
stated as provider, unless `dipCod` is the `NN` placeholder. Courses are the learning activities of each UGov teaching
plan, keyed by program and `afGenCod`, so that each stands for the page the catalogue publishes within its program; an
activity listed by several regulations is read once, from the most recent. Year and term come from the plan `aaOffId`
and the activity `tipoCicloCod`; the plan texts feed the course contents (`CONTENUTI`, `METODI_DID`, `TESTI_RIF`),
outcomes (`OBIETT_FORM`), prerequisites (`PREREQ`) and examination requirements (`MOD_VER_APPR`), each in the language
it states, and `OB_SVIL_SOS` is read for the SDGs it numbers. Names shared by several programs are qualified with the
cohort of their catalogue page, names shared by several courses with the name of their program.

- **2026-10-29** – ported to the TypeScript loader: offerings stated one at a time with unchanged ones skipped and a
	retraction floor; the offer year switches in August; a teaching plan failing to load fails the run
- **2026-09-21** – link programs and courses to their pages on the CINECA course catalogue, composing the address from
  codes the sources already carry and keeping it only once the catalogue confirms it; identify a course by program as
  well as by code, so that each entry stands for one published page, and qualify a course name with its program and a
  program name with its cohort where they would otherwise be ambiguous; map an activity listed under several
  regulations once, from the newest
- **2026-07-21** – map the UGov `MOD_VER_APPR` text section to the examination requirements
  (`schema:competencyRequired`) and append `METODI_DID` and `TESTI_RIF` to the course contents (`schema:teaches`)
- **2026-07-17** – map academic year (`ec2u:year`) and term (`ec2u:term`) from the UGov `aaOffId` and `tipoCicloCod`
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
