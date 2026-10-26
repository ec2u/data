---
title: Events › Salamanca › University
summary: Integration status for Salamanca events
description: Integration status for the Salamanca university events dataset, current and superseded source versions.
status: active
---

Authoritative integration status for the Salamanca university events dataset. The most recent version is listed first;
superseded versions are kept below for the record.

# 2026-09-14 – search crawling

Event catalogue retrieved by crawling the event search; event info extracted by AI from event pages.

| Source                   | Description  |
|--------------------------|--------------|
| https://eventum.usal.es/ | Eventum [es] |

The search page renders no results of its own: the cards are assembled by a form post to
`https://eventum.usal.es/search/basic_search_ajax/{page}`, which answers a page of cards to a blank `keyword` field and
nothing at all to a request stating no field. The pager links state the other pages as fragments of the search page
(`#2`, `#3`) rather than as addresses, so the page number is read from the fragment and the endpoint address rebuilt
around it. Each card links its event twice, from its image and from its title, so the title link alone is followed.

An event page renders its content client-side from a script, so its markup carries no text and the page reader falls
back to the schema.org `Event` the page embeds as `<script type="application/ld+json">` in its head, which carries the
name, description, dates, attendance mode, venue and image. A page whose markup renders its sharing links as text is
still read as that text, and yields an event stated by its title and categories alone. The page address answers a
`301` to the same path without the `event_detail` segment; the listed address stays the identity of the event.

- **2026-10-26** – event pages read from their embedded schema.org description, as the markup renders client-side and
  eight pages in nine yielded nothing
- **2026-09-14** – migrated from the iCal calendar to search crawling, as the calendar carried only the events of one
  location and stated the event page as the description of an entry

# 2025-05-09 – iCal calendar

Event catalogue retrieved from the iCal calendar published per location; event info extracted by AI from event pages.

| Source                                          | Description                                    |
|-------------------------------------------------|------------------------------------------------|
| https://eventum.usal.es/ics/location/spain/lo-1.ics | Eventum calendar, Spanish location [es]     |
| https://eventum.usal.es/kml.html                | index of the locations calendars are published for |

- **2025-05-09** – initial integration
