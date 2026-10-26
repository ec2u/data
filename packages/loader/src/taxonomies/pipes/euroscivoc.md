---
title: Taxonomies › EuroSciVoc
summary: Integration status for the European Science Vocabulary
description: Integration status for the EuroSciVoc field of science taxonomy, current and superseded source versions.
status: active
---

Authoritative integration status for the European Science Vocabulary (EuroSciVoc), the field of science taxonomy
published by the Publications Office of the European Union. The most recent version is listed first.

# 2026-10-26 – SKOS-XL distribution

Topics drawn from the SKOS-XL RDF/XML distribution of version 1.6-20250924 and replaced as a whole under a single store
transaction; a document naming fewer than three quarters of the stored topics states nothing and fails the run.

| Source                                             | Description                              | Notes                                                                      |
|----------------------------------------------------|------------------------------------------|----------------------------------------------------------------------------|
| [op.europa.eu/…/euvoc-download-handler…][rdf]      | EuroSciVoc SKOS-XL distribution [en]     | Flat RDF/XML, one `rdf:Description` per resource; pinned to `20250924-0`   |
| [op.europa.eu/…/resource?uri=…euroscivoc][eurosci] | EuroSciVoc dataset distributions [en]    | Landing page listing the distributions; not retrieved                      |
| `euroscivoc.json`                                  | Topic definitions recovered from v1 [en] | AI-generated definitions keyed by concept UUID; topics flagged `generated` |

- Concepts are selected as `rdf:Description` resources typed `skos:Concept`; English labels are reached through the
	`skosxl:prefLabel` and `skosxl:altLabel` resources and their `skosxl:literalForm`, as no plain labels are stated.
- Topics are named by the concept UUID relative to `http://data.europa.eu/8mn/euroscivoc/`, reproducing the v1
	identifiers; the hierarchy comes from `skos:broader`, a single parent per concept, rather than from nested paths.
- The source carries no definitions: `euroscivoc.json` holds the definitions v1 generated for every concept, retrieved
	from `https://data.ec2u.eu/taxonomies/euroscivoc/`; a concept missing from it is stated without a definition.
- Labels lead with the `skos:notation`, an opaque CORDIS number, as in v1.

- **2026-10-26** – initial integration

[rdf]: <https://op.europa.eu/o/opportal-service/euvoc-download-handler?cellarURI=http%3A%2F%2Fpublications.europa.eu%2Fresource%2Fdistribution%2Feuroscivoc%2F20250924-0%2Frdf%2Fskos_xl%2FEuroSciVoc.rdf&fileName=EuroSciVoc.rdf>

[eurosci]: <https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http://publications.europa.eu/resource/dataset/euroscivoc>
