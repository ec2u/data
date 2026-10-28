---
title: Documents › Salamanca › University
summary: Integration status for the Salamanca University institutional documents
description: Integration status for the institutional documents shared by Salamanca University, current and superseded source versions.
status: active
---

Authoritative integration status for the Salamanca University institutional documents, most recent version first.

# 2023-07-12 – Curated sheet

Documents are drawn from a manually curated Google Sheet published as CSV and replaced as a whole under a single store
transaction. A sheet naming fewer than three quarters of the stored documents states nothing and fails the run, so
pruning the sheet below that share requires a forced reload, run by an operator once the withdrawal is confirmed.

| Source                    | Description                                         | Notes                                                                                       |
|---------------------------|-----------------------------------------------------|---------------------------------------------------------------------------------------------|
| `documents-salamanca-url` | Salamanca University documents spreadsheet [en, es] | CSV export URL held in GCP Secret Manager under this key; header row, untitled rows skipped |

Each row states one document, keyed by its `Identifier` or, failing that, by its English or local title: retitling a
document without an identifier replaces it with a new one. Titles, descriptions and publisher names are read from the
`(English)` and `(Local)` column pairs, and a title or description stated only locally is translated to English. People
are read from `Contact` and `Contributor` only when written as `Family, Given (Title)`, and `Related` names other rows
by identifier or title. The `Type` and `Audience` columns guide the classification against the EC2U document and
stakeholder taxonomies. For this sheet, most rows list web pages rather than documents; contacts are email addresses and
yield no people.

- **2026-10-28** – ported to the TypeScript loader: local-only titles and descriptions translated to English, types and
	audience classified against the taxonomies with the sheet columns as cues, unchanged rows skipped
- **2023-07-12** – initial integration
