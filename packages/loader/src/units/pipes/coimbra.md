---
title: Units › Coimbra
summary: Integration status for the Coimbra University research units
description: Integration status for the research units of Coimbra University, current and superseded source versions.
status: active
---

Authoritative integration status for the Coimbra University research units, most recent version first, with the
superseded versions kept below for the record of how the source was harvested before.

# 2022-04-19 – Dedicated API

Units are drawn from a dedicated REST/JSON API of the University of Coimbra, authenticated by a key sent in a `Key`
request header, and stated one at a time, so an interrupted run keeps the units it stated and the next one carries on;
unchanged units are skipped. A listing naming fewer than three quarters of the stored units retracts nothing and fails
the run, as does a listing that fails to be retrieved or answers with an error object instead of an array.

| Source                                                                     | Description                     | Notes                                                                    |
|----------------------------------------------------------------------------|---------------------------------|--------------------------------------------------------------------------|
| `units-coimbra-url`                                                        | Coimbra units API [en, pt]      | endpoint URL held in GCP Secret Manager under this key; answers with a 301 redirect |
| `units-coimbra-key`                                                        | Coimbra units API key           | sent as the `Key` request header; held in GCP Secret Manager             |
| https://www.uc.pt/iii/investigacao/unidades-i-d-e-laboratorios-associados/ | R&D units [pt]                  | public listing the API feeds                                             |

Each unit is keyed by its API `id`, which is also stated as its identifier. The listing repeats every unit several
times over, identically, so each unit is stated once. Names, acronyms and descriptions are read from their `_en` and
`_pt` pairs, and a name or description stated only in Portuguese is translated to English. The API swaps `forename`
and `surname`, as the full `head` name shows, so they are read the other way round; the legacy loader did not, and
stored heads with their names reversed. Every unit stands directly under the university. The type, the knowledge
branch and the topics guide the classification against the EC2U organisation taxonomy and EuroSciVoc, while the
embedded `logo_Base64` image, which makes up most of the payload but no unit fact the dataset holds, is ignored.

- **2026-10-28** – ported to the TypeScript loader: duplicated listing entries collapsed, head names read in the
	right order, types and subjects classified against the taxonomies with the API cues, unchanged units skipped
- **2022-05-03** – ingest description and head name
- **2022-04-19** – initial integration, upgrade to dedicated API

# 2021-12-13 – Curated spreadsheet

Data loaded from a manually curated spreadsheet.

- **2021-12-13** – initial integration from manually curated spreadsheet
