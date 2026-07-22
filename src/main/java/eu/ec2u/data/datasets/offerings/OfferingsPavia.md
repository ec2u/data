---
title: Offerings › Pavia
summary: Integration status for Pavia offerings
description: Integration status for the Pavia university offerings dataset.
status: active
---

Authoritative integration status for the Pavia offerings dataset.

# 2024-10-30 – ESSE3, UGov and LLM extraction

Undergraduate data from public ESSE3 and internal UGov APIs; doctorate and specialisation-school data extracted by LLM
from program pages.

| Source                                                                     | Description             | Notes                                      |
|----------------------------------------------------------------------------|-------------------------|--------------------------------------------|
| https://studentionline.unipv.it/e3rest/api/offerta-service-v1              | ESSE3 API [it]          | undergraduate basic data                   |
| [studentionline.unipv.it/e3rest/docs/…][esse3-docs]                        | ESSE3 API docs [it]     | API documentation                          |
| internal UGov APIs                                                         | UGov API [it]           | undergraduate extended data; no public URL |
| https://phd.unipv.it/la-scuola-di-alta-formazione-dottorale-di-pavia-safd/ | doctoral school [it]    | doctorate programs (LLM)                   |
| [portale.unipv.it/it/…/laureati-medici][spec-medici]                       | medics schools [it]     | specialisation schools (LLM)               |
| [portale.unipv.it/it/…/laureati-non-medici][spec-non-medici]               | non-medics schools [it] | specialisation schools (LLM)               |

- **2026-07-21** – map the UGov `MOD_VER_APPR` text section to the examination requirements
  (`schema:competencyRequired`) and append `METODI_DID` and `TESTI_RIF` to the course contents (`schema:teaches`)
- **2026-07-21** – extract goals, structure and contents for `schema:teaches` and graduation requirements for
  `schema:competencyRequired` from the doctorate and specialisation-school pages
- **2026-07-17** – map academic year (`ec2u:year`) and term (`ec2u:term`) from the UGov `aaOffId` and `tipoCicloCod`
- **2024-11-07** – doctorate and specialisation schools integration
- **2024-10-31** – UGov integration
- **2024-10-30** – migration to ESSE3; initial integration

[esse3-docs]: https://studentionline.unipv.it/e3rest/docs/?urls.primaryName=Offerta%20Api%20V1%20(https%3A%2F%2Fstudentionline.unipv.it%2Fe3rest%2Fapi%2Fofferta-service-v1)

[spec-medici]: https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-medici

[spec-non-medici]: https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-non-medici
