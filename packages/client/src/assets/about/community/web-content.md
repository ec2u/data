---
title: Web Content Guidelines
---

The hub reads source pages much as a visitor does and uses AI to extract structured information from them. Content that
a person can scan and understand at a glance is therefore also content that the hub can harvest completely and
accurately. These guidelines are addressed to the teams that run university websites, and apply to every page the hub
reads or should read, whatever the platform or content management system that serves it.

The guidelines refer to two kinds of page. An **item page** describes a single resource, such as an event, a course or a
document. An **index page** lists the items of one kind and links to their pages. Each guideline improves the entries of
a site on its own, so they can be adopted one at a time. Embedded data brings the largest gain, as it lets the hub read
content exactly as it is stored, with less reliance on AI extraction and fewer errors.

> [!TIP]
> What helps AI models read a page also helps people read it. A page that a model can parse without guessing is one
> that visitors can scan at a glance, assistive technologies can navigate and search engines can index. Each guideline
> below improves the quality of a site for its readers and for the hub at once, with a single effort.

# Site Structure

The hub finds items by following links from index pages to item pages. A site with one index page for each kind of
content, linking to one page per item, lets the hub find every item and follow its changes over time.

## Index Pages

- Keep a single index page for each kind of content, linking to every item of that kind
- Page long indexes with plain links to real addresses, not with buttons or scripts that load more content in place
- Keep every item reachable by following index pages alone, with no search form or filter to submit
- Keep current and past items apart, for example through a separate archive index

## Item Pages

- Give each item a page of its own, focused on that item alone
- Keep item addresses free of session identifiers, tracking parameters and [fragments][fragment]
- Keep item addresses stable, and [redirect][redirections] them permanently (HTTP [`301`][301]) when they must change
- Keep each page online while its item remains relevant, stating any change in its status rather than removing it
- Answer HTTP [`404`][404] or [`410`][410] for items removed for good, rather than a redirect home or an empty page

# Page Delivery

The hub reads pages as an automated client, on a regular schedule. Pages that serve their content directly to such a
client are harvested in full and kept current at little cost, both for the site and for the hub.

## Rendering

- Serve the content in the [HTML][html] of the page, not only through [scripts that run in the browser][csr]
- Serve [valid][validator] HTML encoded in [UTF-8][utf-8]
- Support standard [HTTP caching][caching], so that clients can tell whether a page has changed since their last visit
	- identify the current version of each page with a [`Last-Modified`][last-modified] or [`ETag`][etag] response header
	- answer [conditional requests][conditional] ([`If-Modified-Since`][if-modified-since],
		[`If-None-Match`][if-none-match]) with [`304`][304] when the page is unchanged

## Access

- Keep index and item pages publicly accessible, without login, cookie walls or consent screens that hide the content
- Keep index and item pages free of bot challenges and CAPTCHAs
- Allow automated access to index and item pages in [`robots.txt`][robots]

# Page Content

Clear markup lets the hub tell the item apart from the rest of the page and read each of its properties without
guessing. The same markup makes the page more accessible to visitors and more visible in search engines.

## Layout

- Mark up the title as the [main heading][headings] of the page, free of site names or decorative prefixes
- Keep the item description in the [main content][main] of the page, apart from navigation, banners and related content
- Use [semantic][semantics] HTML: a consistent heading hierarchy, lists for lists, tables for tabular data
- Link related items rather than naming them in text
- Give every link [text that names its target][link-text], not generic labels such as "read more" or "click here"

## Properties

- Publish each property of an item as a distinct, labelled element, not inside free text
- State any identifier the organisation assigns to an item, so that the hub can match it across pages and languages
- State [dates and times][time] in one unambiguous format, with the time zone where it matters
- State each date in full, rather than as a relative or recurring expression such as "next week" or "every Monday"
- State locations with their full name and address, or as online where there is no physical one
- State quantities, such as amounts, durations or credits, as numeric values with their units

# Page Language

Separate language versions let the hub offer every item in each language it is published in, and link the versions of
the same item to one another, so that readers can switch between them.

- Declare the language of each page in its [`lang`][lang] attribute
- Publish translations as separate pages at their own addresses, linked to one another through [`hreflang`][hreflang]

# Embedded Data

Embedded data is a machine-readable copy of the content of a page, carried in the page as a [JSON-LD][json-ld]
script. The [schema.org][schema] vocabulary is suggested, as it is widely supported, but other vocabularies are
accepted. The hub reads embedded data exactly as it is stored, with no extraction step to misread it. This makes it the
most reliable way to harvest a site completely and accurately, whatever the layout of its pages.

- Embed the entire content of each item page, not only its metadata, consistent with what the page shows
- Embed content rendered from a database, an API or a content management system as stored, even [on the server][ssr]
- Describe each item with the most specific type the vocabulary offers
- Use [ISO 8601 dates][dates] and standard codes for [languages][bcp-47], countries and currencies
- Embed in each index page a list, such as a schema.org [`ItemList`][item-list], of the addresses of the items it shows
- Embed in each paged index page the address of the next page, so that following the pages in turn reaches every item

# Coordination

The quality of the harvest depends on the structure of each site, so changes on either side are best agreed in advance.

- Name a technical contact for each site, so that the hub can report harvesting problems and agree on changes
- Announce a redesign or move through a GitHub [issue][issues] before it goes live, so that the harvest keeps pace
- Send questions on these guidelines through a GitHub [issue][issues] as well

[issues]: https://github.com/ec2u/data/issues

[schema]: https://schema.org/

[item-list]: https://schema.org/ItemList

[json-ld]: https://json-ld.org/

[redirections]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Redirections

[301]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/301

[fragment]: https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment

[404]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404

[410]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/410

[html]: https://developer.mozilla.org/en-US/docs/Glossary/HTML

[csr]: https://developer.mozilla.org/en-US/docs/Glossary/CSR

[validator]: https://developer.mozilla.org/en-US/docs/Glossary/Validator

[utf-8]: https://developer.mozilla.org/en-US/docs/Glossary/UTF-8

[caching]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching

[last-modified]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Last-Modified

[etag]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag

[conditional]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests

[if-modified-since]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Modified-Since

[if-none-match]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-None-Match

[304]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304

[robots]: https://developer.mozilla.org/en-US/docs/Glossary/Robots.txt

[headings]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements

[main]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/main

[semantics]: https://developer.mozilla.org/en-US/docs/Glossary/Semantics

[link-text]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Text_labels_and_names

[time]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/time

[ssr]: https://developer.mozilla.org/en-US/docs/Glossary/SSR

[dates]: https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Date_and_time_formats

[bcp-47]: https://developer.mozilla.org/en-US/docs/Glossary/BCP_47_language_tag

[lang]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang

[hreflang]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/link#hreflang
