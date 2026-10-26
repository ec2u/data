---
title: Taxonomies › ISCED 2011
summary: Integration status for the ISCED 2011 education level taxonomy
description: Integration status for the ISCED 2011 education level taxonomy, current and superseded source versions.
status: active
---

Authoritative integration status for the ISCED 2011 education level taxonomy published by the UNESCO Institute for
Statistics. The most recent version is listed first.

# 2025-09-26 – Curated spreadsheet

Levels transcribed from the UNESCO classification into a manually curated Google Sheet published as CSV, then replaced
as a whole under a single store transaction; a document naming fewer than three quarters of the stored topics states
nothing and fails the run, so pruning the sheet below that share requires a forced reload.

| Source                                          | Description                              | Notes                                                                                    |
|-------------------------------------------------|------------------------------------------|------------------------------------------------------------------------------------------|
| `taxonomies-ec2u-isced-2011`                    | ISCED 2011 level spreadsheet [en]        | CSV export URL held in GCP Secret Manager under this key; header row, blank rows skipped |
| [uis.unesco.org/…isced-2011-en.pdf][isced-2011] | UNESCO classification, edition 2011 [en] | Authority the spreadsheet transcribes; not retrieved by the pipe                         |

- **2026-10-26** – publisher and licenses stated with their labels alongside the taxonomy
- **2025-09-26** – initial integration

[isced-2011]: <https://uis.unesco.org/sites/default/files/documents/international-standard-classification-of-education-isced-2011-en.pdf>
