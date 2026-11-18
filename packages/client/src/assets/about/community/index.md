---
title: Get Involved
---

The hub is only as complete and accurate as the sources it harvests and the feedback it receives. The universities that
publish its content, the teams that run their websites and the developers who build on its data all shape what it offers
to the alliance, and each of them gains in reach, quality or reuse from taking an active part.

# Publishers

**Benefits** – The hub brings the content of each publisher to the academic community of the whole alliance and to the
communities around it. A single multilingual catalogue and shared taxonomies make that content easy to find in
alliance-wide searches and connect it to related resources of partner universities. Every resource links back to its
original page, which remains the authoritative source. Machine-readable datasets also let third-party services reuse the
content with no extra effort from the publisher, extending its reach beyond the hub.

**Why Get Involved** – The hub is the shared knowledge infrastructure of the alliance, co-funded by the European Union
under Erasmus+. Complete coverage supports mobility, joint programmes and research collaboration across the alliance. A
university with missing or outdated sources is under-represented in alliance-wide searches.

**How to Get Involved** – Start by reviewing the content the hub already holds for your university, using the university
filter of each catalogue. To propose a new source or a change to an existing one, open a GitHub [issue][issues] stating
the dataset, the address of the content, its languages, its update frequency and a contact person. Correct errors in the
content on your own site: the next scheduled harvest carries the correction to the hub. Report errors introduced by the
hub, such as a wrong extraction or classification, through the Feedback button of the affected page or a GitHub
[issue][issues], naming the affected resource and the correct value where known.

**What to Know** – Publishers remain responsible for the accuracy of their content and for the rights over it. The hub
harvests only publicly accessible pages, on a regular schedule, so changes appear after a delay. AI enriches harvested
content, and generated resources carry a badge described in the [AI Content Notice](../legal/ai). Rights holders can ask
for content to be corrected or removed through the [EC2U Connect Centre][cc]. The [Privacy Notice](../legal/privacy)
covers the people named in harvested content and the rights they hold over their personal data.

- [Providing Feedback](feedback) — how to report problems, suggest improvements and ask questions about the hub

# Webmasters

**Benefits** – Every hub resource links back to its source page, bringing visitors to the site. Well-structured pages
produce complete and accurate entries, with less reliance on AI extraction. Clear, stable pages also serve human
visitors better, improving the accessibility of the site and its visibility in search engines.

**Why Get Involved** – The hub reads source sites much as a visitor does, so the quality of its entries depends on how
each site publishes its content. Sites that follow the Web Content Guidelines, with stable addresses, plain HTML content
and embedded structured data, are harvested completely and kept current at little cost. Content hidden behind scripts,
forms or inconsistent layouts is harder to extract and more likely to be missing or wrong.

**How to Get Involved** – Start by implementing the Web Content Guidelines below on the pages the hub reads or should
read. Name a technical contact for each site, and let the hub know through a GitHub [issue][issues] before a redesign or
move, so that the harvest keeps pace. Send questions on the guidelines through a GitHub issue as well.

**What to Know** – The hub reads only publicly accessible pages, on a regular schedule, so site changes appear on the
hub after a delay. It never modifies source sites: it only copies their content and links back to them.

- [Web Content Guidelines](web-content) — how to publish web pages that the hub harvests completely and accurately

# Developers

**Benefits** – The hub offers a single API to harmonised data from every EC2U university, in place of one integration
per site. Its datasets are cross-linked and classified by shared taxonomies. The REST/JSON-LD API supports faceted
search and linked data navigation across every dataset. The software running the hub is open source under the Apache
License 2.0, and anyone can inspect, reuse or extend it within the terms of that licence.

**Why Get Involved** – Services built on the hub, such as course finders or event calendars, extend the reach of the
alliance. Reports of data errors improve the hub for every user, and code contributions shape its evolution.

**How to Get Involved** – Start by exploring the datasets online, then read the guides below on the concepts, data model
and query language of the API. On GitHub, use a [discussion][discussions] for questions and ideas, an [issue][issues]
for data or API problems and feature requests, and a [pull request][code] to contribute code.

**What to Know** – Each dataset states its licence on its info page. The licence covers only the catalogue records:
reuse them within its terms and credit the EC2U Alliance. The content those records describe remains subject to the
rights of its original publishers, as set out in the [Legal Notice](../legal/#content): check them through the source
link of each resource before reuse. AI-generated resources may contain errors, as described in the
[AI Content Notice](../legal/ai). Data is refreshed regularly, and resources change or disappear when their sources do.

- [Linked Data](linked-data/) — a primer on the linked data concepts and the JSON-LD format of the API
- [Accessing the API](api-access) — how to address resources, negotiate formats and languages, and handle errors
- [Querying the API](api-queries) — how to retrieve, expand, filter, sort and count dataset resources through the API
- [API & Data Model](/api/) — the reference of the hub API: its datasets, their resource types and their properties

[issues]: https://github.com/ec2u/data/issues

[discussions]: https://github.com/ec2u/data/discussions

[code]: https://github.com/ec2u/data

[cc]: mailto:cc@ml.ec2u.eu
