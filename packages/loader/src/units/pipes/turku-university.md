---
title: Units › Turku › University
summary: Integration status for the Turku University research units
description: Integration status for the research units listed by Turku University, current and superseded source versions.
status: active
---

Authoritative integration status for the Turku University research units, most recent version first.

# 2022-12-13 – Curated sheet

Units are drawn from a manually curated Google Sheet published as CSV and stated one at a time, so an interrupted run
keeps the units it stated and the next one carries on; unchanged rows are skipped. A sheet naming fewer than three
quarters of the stored units retracts nothing and fails the run, so pruning the sheet below that share requires a
forced reload, run by an operator once the withdrawal of the missing units is confirmed with the university.

| Source           | Description                                | Notes                                                                       |
|------------------|--------------------------------------------|-----------------------------------------------------------------------------|
| `units-turku-url` | Turku University units spreadsheet [en, fi] | CSV export URL held in GCP Secret Manager under this key; header row, unnamed rows skipped |

Each row states one unit, keyed by its `Code` or, failing that, by its English or local name: renaming a unit without a
code replaces it with a new one. Names and descriptions are read from the `(English)` and `(Local)` column pairs, and a
name or description stated only locally is translated to English. Web addresses are read from the `Factsheet` and
`Homepage` columns, the head from `Head` only when written as `Family, Given (Title)`. `Parent` names other rows by
code, acronym or name, a unit with no matching parent standing under the university, and `VI` names the EC2U virtual
institutes by acronym. The `Type` and `Topics` columns guide the classification against the EC2U organisation taxonomy
and EuroSciVoc. For this sheet, units carry no code or head, parents name faculties the sheet does not list, and the two
rows named `Smart Systems` share a key, so they are stated as a single unit, the later row taking precedence.

- **2026-10-28** – ported to the TypeScript loader: local-only names and descriptions translated to English, types and
	subjects classified against the taxonomies with the sheet columns as cues, unchanged rows skipped
- **2022-12-13** – initial integration
