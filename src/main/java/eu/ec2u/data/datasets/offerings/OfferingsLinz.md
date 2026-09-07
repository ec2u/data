---
title: Offerings › Linz
summary: Integration status for Linz offerings
description: Integration status for the Linz university offerings dataset.
status: active
---

Authoritative integration status for the Linz offerings dataset.

# 2025-03-24 – REST/JSON APIs

Data extracted from dedicated REST/JSON APIs.

| Source                                     | Description          | Notes                                     |
|--------------------------------------------|----------------------|-------------------------------------------|
| https://ec2u.datahub.jku.at/api/1/programs | degree programs [de] | English names and descriptions translated |
| https://ec2u.datahub.jku.at/api/1/courses  | courses [de, en]     | no course descriptions provided           |

- **2026-09-07** – fix the nightly crawling URL, which pointed to a non-existent `/programs` sub-route and silently
  returned 404 since 2025-02-11
- **2025-04-28** – update courses pipeline to read `educationalLevel` directly from the course description
- **2025-03-24** – initial integration
