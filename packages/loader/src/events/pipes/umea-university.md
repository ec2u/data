---
title: Events › Umeå › University
summary: Integration status for Umeå events
description: Integration status for the Umeå university events dataset.
status: active
---

Authoritative integration status for the Umeå university events dataset.

# 2025-05-16 – AI extraction

Event info extracted by AI from the event catalogue and linked event pages.

| Source                        | Description |
|-------------------------------|-------------|
| https://www.umu.se/en/events/ | events [en] |

Event pages embed no structured metadata such as schema.org JSON-LD, so every fact comes from the page text.

- **2026-11-24** – staff photo addresses on event pages carry a `v` query parameter that changes every day; it is now
	dropped before pages are compared, so unchanged events are no longer extracted again on every run ([#119])
- **2025-05-16** – initial integration

[#119]: https://github.com/ec2u/data/issues/119
