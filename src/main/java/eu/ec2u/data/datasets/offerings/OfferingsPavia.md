---
title: Pavia › Offerings
summary: Integration status for Pavia offerings
description: Integration status for the Pavia university offerings dataset.
university: Pavia
dataset: Offerings
status: active
version: 2024-10-30
---

Authoritative integration status for the Pavia offerings dataset.

# 2024-10-30 – ESSE3, UGov and LLM extraction

Undergraduate data from public ESSE3 and internal UGov APIs; doctorate and specialisation-school data extracted by LLM
from program pages.

- Undergraduate programs and courses
  - Basic data extracted from the public [ESSE3 API][esse3-docs]
  - Extended data extracted from internal UGov APIs
- Doctorate Programs
  - Data extracted by LLM from the [doctoral school][phd-safd] and linked program pages
- Specialisation Schools
  - Data extracted by LLM from the area-sanitaria specialisation-school pages

| Source                                | Notes                          |
|---------------------------------------|--------------------------------|
| [ESSE3 API][esse3-api]                | ESSE3 API; undergraduate basic |
| internal UGov APIs                    | undergraduate extended         |
| [doctoral school][phd-safd]           | doctorate programs (LLM)       |
| [medics schools][spec-medici]         | specialisation schools (LLM)   |
| [non-medics schools][spec-non-medici] | specialisation schools (LLM)   |

- **2024-11-07** – doctorate and specialisation schools integration
- **2024-10-31** – UGov integration
- **2024-10-30** – migration to ESSE3; initial integration

[esse3-docs]: https://studentionline.unipv.it/e3rest/docs/?urls.primaryName=Offerta%20Api%20V1%20(https%3A%2F%2Fstudentionline.unipv.it%2Fe3rest%2Fapi%2Fofferta-service-v1)
[esse3-api]: https://studentionline.unipv.it/e3rest/api/offerta-service-v1
[phd-safd]: https://phd.unipv.it/la-scuola-di-alta-formazione-dottorale-di-pavia-safd/
[spec-medici]: https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-medici
[spec-non-medici]: https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-non-medici
