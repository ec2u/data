---
title: Taxonomies › ISCED-F 2013
summary: Integration status for the ISCED-F 2013 field of education taxonomy
description: Integration status for the ISCED-F 2013 field of education taxonomy, current and superseded source versions.
status: active
---

Authoritative integration status for the ISCED-F 2013 field of education taxonomy, the field classification accompanying
ISCED 2011 and published by the UNESCO Institute for Statistics. The most recent version is listed first.

# 2026-10-26 – SKOS distribution

Topics drawn from the SKOS-AP-EU RDF/XML distribution of version 20240110-0 published by the EU Vocabularies service, in
place of a transcription of the UNESCO source, and replaced as a whole under a single store transaction.

| Source                                        | Description                                      | Notes                                                                    |
|-----------------------------------------------|--------------------------------------------------|--------------------------------------------------------------------------|
| [op.europa.eu/…/euvoc-download-handler…][rdf] | ISCED-F SKOS-AP-EU distribution [en]             | Flat RDF/XML, one `rdf:Description` per resource; pinned to `20240110-0` |
| [uis.unesco.org/…2015-en.pdf][isced-f-2013]   | UNESCO classification, detailed fields 2015 [en] | Authority the distribution reproduces; not retrieved                     |
| `isced-f-2013.json`                           | Topic definitions recovered from v1 [en]         | AI-generated definitions keyed by field code; topics flagged `generated` |

- Concepts are selected as `rdf:Description` resources typed `skos:Concept`; English labels are read from the plain
	`skos:prefLabel` literals, which the distribution also restates as SKOS-XL labels, so duplicates are collapsed.
- Topics are named by the field code relative to `http://data.europa.eu/snb/isced-f/` (`00`, `001`, `0011`), reproducing
	the v1 identifiers; the hierarchy comes from `skos:broader` rather than from nested paths.
- The source carries no definitions: `isced-f-2013.json` holds the definitions v1 generated for every field, retrieved
	from `https://data.ec2u.eu/taxonomies/isced-f-2013/`; a field missing from it is stated without a definition.

- **2026-10-26** – initial integration

[rdf]: <https://op.europa.eu/o/opportal-service/euvoc-download-handler?cellarURI=http%3A%2F%2Fpublications.europa.eu%2Fresource%2Fdistribution%2Finternational-education-classification%2F20240110-0%2Frdf%2Fskos_ap_eu%2Finternational-education-classification-skos-ap-eu.rdf&fileName=international-education-classification-skos-ap-eu.rdf>

[isced-f-2013]: <https://uis.unesco.org/sites/default/files/documents/international-standard-classification-of-education-fields-of-education-and-training-2013-detailed-field-descriptions-2015-en.pdf>
