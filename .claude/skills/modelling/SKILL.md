---
name: modelling
description: Document and structure EC2U Knowledge Hub data models. Use when editing dataset or vocabulary documents under src/main/static, describing entities and properties, or cross-linking to standard vocabularies.
---

Document the Knowledge Hub data models.

# Documents

Data models are described by markdown files under `src/main/static/datasets/` and
`src/main/static/about/vocabularies/`. Each document opens with a brief summary of the vocabulary after the YAML front
matter, cross-linked to the overview reference documents for the vocabularies in use, and describes entities and their
properties in tabular form.

Standard vocabularies (Schema.org, FOAF, SKOS, W3C Organization Ontology) are defined in
`src/main/java/eu/ec2u/data/vocabularies`.

# Entities and Properties

- Give every entity and property a description, cross-linked as required
- Describe properties with respect to the object being defined (for example, the name of the person)
- Introduce references to other entities as "link to …" or "links to …" according to the property cardinality

# Consistency

- Keep definitions consistent with the authoritative ones in `src/main/java/eu/ec2u/data/datasets/` and
  `src/main/java/eu/ec2u/data/vocabularies`, including their subpackages
- Prefer links to locally defined well-known vocabularies where available; link to online standard reference documents
  otherwise
