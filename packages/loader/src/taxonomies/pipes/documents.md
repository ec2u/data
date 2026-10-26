---
title: Taxonomies › Documents
summary: Integration status for the EC2U document type taxonomy
description: Integration status for the EC2U document type taxonomy, current and superseded source versions.
status: active
---

Authoritative integration status for the EC2U document type taxonomy. The most recent version is listed first.

# 2025-09-26 – Curated spreadsheet

Topics drawn from a manually curated Google Sheet published as CSV and replaced as a whole under a single store
transaction; a document naming fewer than three quarters of the stored topics states nothing and fails the run, so
pruning the sheet below that share requires a forced reload.

| Source                      | Description                         | Notes                                                                                    |
|-----------------------------|-------------------------------------|------------------------------------------------------------------------------------------|
| `taxonomies-ec2u-documents` | EC2U document type spreadsheet [en] | CSV export URL held in GCP Secret Manager under this key; header row, blank rows skipped |

- **2026-10-26** – publisher and licenses stated with their labels alongside the taxonomy
- **2025-09-26** – initial integration
