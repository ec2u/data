---
title: Jena › Events
summary: Integration status for Jena events
description: Integration status for the Jena university events dataset, current and superseded source versions.
university: Jena
dataset: Events
status: active
version: 2025-05-08
---

Authoritative integration status for the Jena university events dataset. The most recent version is listed first;
superseded versions are kept below for the record.

# 2025-05-08 – AI extraction

Event info extracted by AI from the event catalogue and linked event pages. Both German and English endpoints are
scanned, generating independent events; matching and merging localised descriptions of the same events was deemed too
complex and brittle.

| Source                                            | Notes                        |
|---------------------------------------------------|------------------------------|
| General university events                         | [DE][gen-de]; [EN][gen-en]   |
| International Office                              | [DE][io-de]; [EN][io-en]     |
| International Office Calendar (incoming students) | [DE][ioc-de]; [EN][ioc-en]   |
| EC2U-specific                                     | [DE][ec2u-de]; [EN][ec2u-en] |
| Graduate Academy                                  | [DE][grad-de]; [EN][grad-en] |

- **2025-05-08** – migrated to AI extraction

# 2022-03-05 – schema.org scraping

No structured event index: event URLs are scraped by crawling from the entry page, and data is extracted from the
schema.org-based event description embedded into each page as a `<script type="application/ld+json">` HTML head element
(JSON-LD + schema.org, page-level metadata only, no general structured index).

| Source                                            | Notes                        |
|---------------------------------------------------|------------------------------|
| General university events                         | [DE][gen-de]; [EN][gen-en]   |
| International Office                              | [DE][io-de]; [EN][io-en]     |
| International Office Calendar (incoming students) | [DE][ioc-de]; [EN][ioc-en]   |
| EC2U-specific                                     | [DE][ec2u-de]; [EN][ec2u-en] |
| Graduate Academy                                  | [DE][grad-de]; [EN][grad-en] |

- **2024-10-08** – fixed XPath expressions for page link scraping; added English event publishers
- **2023-01-10** – removed legacy patch for malformed date time zones
- **2022-06-12** – fixed XPath expressions for page link scraping
- **2022-05-19** – prevented generation of duplicate events when dates are modified (#6)
	- EC2U event IRIs are now generated on the basis of Jena event URLs
	- events published by multiple calendars are recognized and collapsed
- **2022-03-05** – initial integration

[gen-de]: https://www.uni-jena.de/16965/kommende-veranstaltungen

[gen-en]: https://www.uni-jena.de/en/16965/events

[io-de]: https://www.uni-jena.de/17425/veranstaltungskalender

[io-en]: https://www.uni-jena.de/en/17425/upcoming-events

[ioc-de]: https://www.uni-jena.de/81092/kalender-studium-international

[ioc-en]: https://www.uni-jena.de/en/81092/calendar-studium-international

[ec2u-de]: https://www.uni-jena.de/120659/ec2u-veranstaltungen

[ec2u-en]: https://www.uni-jena.de/en/120659/ec2u-veranstaltungen

[grad-de]: https://www.uni-jena.de/17210/veranstaltungen

[grad-en]: https://www.uni-jena.de/en/17210/events
