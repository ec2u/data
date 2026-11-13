---
title: Web Content Guidelines
---

The hub reads source pages much as a visitor does, and uses AI to extract structured information from them. Content
that a person can scan and understand at a glance is therefore also content that the hub can harvest reliably.

# Structure and Navigation

Organise each kind of content as one index page linking to one page per item.

## Index Pages

- Keep a single index page for each kind of content, linking to every item of that kind
- Page long indexes with plain links to real addresses, not buttons or scripts that load more content in place
- Keep every item reachable by following index pages alone, with no search form or filter to submit
- Keep current and past items apart, for example through a separate archive index
- Publish a sitemap that lists every item page, with its last modification date
- Offer a feed (RSS, Atom or iCalendar) where the site platform supports one

## Item Pages

- Give every item a page of its own at a stable, permanent address
- Keep addresses unchanged across redesigns, or redirect old addresses permanently (HTTP 301) to the new ones
- Avoid session identifiers, tracking parameters and fragments in item addresses
- Focus each page on its item alone, rather than combining several items on one page
- Show the identifier the organisation assigns to the item, if any, so that it can be matched across pages and languages
- Keep withdrawn, cancelled or postponed items online with their status stated, rather than deleting them
- Answer HTTP 404 or 410 for items removed for good, rather than redirecting to the home page or serving an empty page

# Rendering

- Serve the content in the HTML of the page, not only through scripts that run in the browser
- Where content is rendered client-side, embed it as raw [schema.org](https://schema.org/) data in a JSON-LD script
  - index pages: an `ItemList` stating the address of each item listed on the page
  - paged index pages: the address of the next page, so that every item stays reachable by following them in turn
  - item pages: the full description of the item, consistent with the rendered content
- Serve valid HTML encoded in UTF-8
- Keep index and item pages publicly accessible, without login, cookie walls or consent screens that hide the content
- Keep index and item pages free of bot challenges and CAPTCHAs, and allow automated access to them in `robots.txt`
- Support standard HTTP caching, so that clients can tell whether a page has changed since their last visit

# Content

- Mark up the title as the main heading of the page and keep it free of site names or decorative prefixes
- Keep the description of the item separate from navigation, banners and related content
- Use semantic HTML: a consistent heading hierarchy, lists for lists, tables for tabular data
- Publish each property of an item as a distinct, labelled element, not inside free text
- State dates and times in a consistent, unambiguous format, with the time zone where relevant
- State the period an item applies to, and publish recurring items as dated occurrences or with explicit recurrence
- State places with their full name and address, and mark online activities explicitly as online
- State quantities (amounts, durations) as explicit values with their units rather than inside sentences
- Link related items rather than naming them in text
- Give every link text that names its target, not generic labels such as "read more" or "click here"

# Structured Data

- Embed [schema.org](https://schema.org/) metadata as JSON-LD in each item page, using the most specific type available
- Keep embedded metadata consistent with the visible content of the page
- Use ISO 8601 dates and standard codes for languages, countries and currencies
- Expose a documented API or data export where the content already lives in a database or management system

# Languages

- Declare the language of each page in its `lang` attribute
- Publish translations as separate pages at their own addresses, linked to each other through `hreflang` links
- Translate the whole item rather than only its title, so that every language version is complete

# Contacts

- Name a technical contact for each site, so that the hub can report harvesting problems and agree on changes
