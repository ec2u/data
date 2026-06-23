---
title: Offerings › Umeå
summary: Integration status for Umeå offerings
description: Integration status for the Umeå university offerings dataset, current and superseded source versions.
status: active
---

Authoritative integration status for the Umeå offerings dataset. The most recent version is listed first; superseded
versions are kept below for the record.

# 2025-11-05 – REST/JSON API

Offerings data retrieved from the undocumented REST/JSON search API supporting the search UI; offering info extracted by
LLM from linked pages.

| Source                                                            | Description               |
|-------------------------------------------------------------------|---------------------------|
| https://www.umu.se/utbildning/valj-utbildning/program-och-kurser/ | programs and courses [sv] |

- **2025-11-05** – migrated from paginated HTML scraping to REST/JSON API (website now uses Vue.js SPA with dynamic
  content)
	- initial implementation used sitemap-based discovery, then migrated to direct API access

# 2025-05-29 – HTML scraping

Offerings data harvested by paginated HTML scraping of the program and course listing pages.

| Source                                                            | Description               |
|-------------------------------------------------------------------|---------------------------|
| https://www.umu.se/utbildning/valj-utbildning/program-och-kurser/ | programs and courses [sv] |

- **2025-05-29** – initial integration
