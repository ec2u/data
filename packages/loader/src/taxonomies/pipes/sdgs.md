---
title: Taxonomies › SDGs
summary: Integration status for the UN Sustainable Development Goals taxonomy
description: Integration status for the UN Sustainable Development Goals taxonomy, current and superseded source versions.
status: active
---

Authoritative integration status for the United Nations Sustainable Development Goals (SDGs) taxonomy, the seventeen
goals of the 2030 Agenda for Sustainable Development. The most recent version is listed first.

# 2026-10-26 – Curated spreadsheet

Goals transcribed from the UN SDG Knowledge Organization System into a manually curated Google Sheet published as CSV,
then replaced as a whole under a single store transaction, reusing the spreadsheet and the vault key of v1 unchanged.

| Source                    | Description                      | Notes                                                                                    |
|---------------------------|----------------------------------|------------------------------------------------------------------------------------------|
| `taxonomies-ec2u-sdgs`    | UN SDGs spreadsheet [en]         | CSV export URL held in GCP Secret Manager under this key; header row, blank rows skipped |
| https://sdgs.un.org/goals | UN Sustainable Development Goals | Authority the spreadsheet transcribes; not retrieved by the pipe                         |

- **2026-10-26** – initial integration
