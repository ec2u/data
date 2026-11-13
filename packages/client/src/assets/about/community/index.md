---
title: Get Involved
---

The hub depends on the institutions that publish its sources, the teams that maintain the source websites and the
developers who reuse its datasets. This page sets out the role of each group and the support the hub provides.

# Roles

## Publishers

### Benefits

- Content reaches students, staff and researchers across the whole alliance, alongside that of partner universities
- A single multilingual catalogue presents the offer of every university in a consistent, comparable form
- Shared taxonomies connect resources across universities and datasets
- Every resource links back to the original page, which remains the authoritative source
- Machine-readable datasets let third-party services reuse the content with no extra effort from the publisher

### Why Get Involved

- The hub is the shared knowledge infrastructure of the alliance, co-funded by the European Union under Erasmus+
- Complete coverage supports mobility, joint programmes and research collaboration across the alliance
- A university with missing or outdated sources is under-represented in alliance-wide searches

### How to Get Involved

- Review the content the hub already holds for your university, using the university filter of each catalogue
- Propose a new source, or a change to an existing one, by opening an [issue][issues] on GitHub
- State the dataset, the address of the content, its languages and update frequency, and a contact person
- Correct errors at the source: the next scheduled harvest applies the correction to the hub
- Report errors introduced by the hub through a GitHub [issue][issues] or the [EC2U Connect Centre][cc]

### What to Know

- Publishers remain responsible for the accuracy of their content and for the rights over it
- The hub harvests only publicly accessible pages, on a regular schedule, so changes appear after a delay
- AI enriches harvested content, and generated resources carry a badge described in the [AI Content Notice](../legal/ai)
- Rights holders can ask for content to be corrected or removed through the [EC2U Connect Centre][cc]
- The [Privacy Notice](../legal/privacy) covers the people named in harvested content and the rights they hold

## Webmasters

### Benefits

- Site content reaches an alliance-wide audience without manual re-entry in another system
- Every resource on the hub links back to the page it came from
- Well-structured pages produce complete and accurate entries, with less reliance on AI extraction
- Early notice of site changes prevents gaps in the hub and broken links back to the site

### Why Get Involved

- The hub depends on the structure of each source site, which it does not control
- An unannounced redesign or move can silently stop the harvest and remove content from the hub
- Clear, stable page structure also improves accessibility and visibility in search engines

### How to Get Involved

- Structure the pages the hub reads as set out in the [Web Content Guidelines](web-content)
- Open an [issue][issues] on GitHub before moving, redesigning or retiring a section the hub reads

### What to Know

- The hub reads only publicly accessible pages, on a regular schedule
- Each harvest depends on specific addresses and page elements, so layout changes may stop it
- The hub never modifies source sites: it copies their content and links back to them
- Questions and change notices go through GitHub [issues][issues]

## Developers

### Benefits

- A single API gives access to harmonised data from every EC2U university, in place of one integration per site
- Datasets are cross-linked and classified by shared taxonomies
- The REST/JSON-LD API supports faceted search and linked data navigation across every dataset
- The software running the hub is open source under the Apache License 2.0

### Why Get Involved

- Services built on the hub, such as course finders or event calendars, extend the reach of the alliance
- Reports of data errors improve the quality of the hub for every user
- Contributions to the open source code base shape the evolution of the hub

### How to Get Involved

- Explore the datasets through the web interface, then consult [API & Models](../api/) for their structure
- Browse the [Categories](/taxonomies/) used to classify resources across datasets
- Start a GitHub [discussion][discussions] to ask a how-to question or share an idea
- Open a GitHub [issue][issues] to report a data or API problem, or to request a feature
- Contribute code through pull requests on [GitHub][code]

### What to Know

- Each dataset states its licence on its info page: reuse it within those terms and credit the EC2U Alliance
- Content from partner universities remains subject to the rights of its original publishers, as set out in the
  [Legal Notice](../legal/): check those rights through the source link of each resource before reusing it
- AI-generated resources may contain errors, as described in the [AI Content Notice](../legal/ai)
- Data is refreshed on a regular schedule: resources change or disappear when their sources do

# Resources

The resources below support each role with practical guidance on publishing, structuring and reusing hub content.

- [Web Content Guidelines](web-content) — how to structure web pages so that the hub reads them reliably
- [Linked Data](linked-data/) — a primer on the linked data concepts and the JSON-LD format of the API

[issues]: https://github.com/ec2u/data/issues

[discussions]: https://github.com/ec2u/data/discussions

[code]: https://github.com/ec2u/data

[cc]: mailto:cc@ml.ec2u.eu
