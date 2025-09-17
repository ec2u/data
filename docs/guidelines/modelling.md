---
title: Data Modelling Guidelines
summary: Standards for documenting and structuring data models
---

# Documentation Structure

Data models are described by markdown files in the `@src/main/static/datasets/` and
`@src/main/static/handbooks/vocabularies` folders; each document:

- Has a brief summary of the vocabulary after the yaml front matter section, cross-linked to overview reference
  documents for the vocabularies in use
- Entities and their properties are described in a tabular format

## Standard Vocabularies

Uses standard vocabularies (Schema.org, FOAF, SKOS, W3C Organization Ontology) defined in
`src/main/java/eu/ec2u/data/vocabularies`

## Published Datasets

Structured data about EC2U universities including courses, events, documents, organizations, persons,
programs, taxonomies, and units. All datasets are semantically linked and support faceted search.

# Entity and Property Documentation

## Entity Descriptions

- Entities and properties have a description, cross-linked as required
- Properties are described with respect to the object being defined (e.g., the name of the person)
- Property names are properly cross-linked to their definitions either in the data model documents or in the vocabulary
  standard document

## Property Relationships

- References to other entities are introduced as "link to …" or "links to …" according to the cardinality of the
  property

# Consistency Requirements

- Property definitions are consistent with respect to the authoritative definitions in the
  `@src/main/java/eu/ec2u/data/datasets/` and `@src/main/java/eu/ec2u/data/vocabularies` packages and subpackages

# Cross-linking Standards

- Links to locally defined well-known vocabularies, wherever available, are preferred; links to online standard
  reference documents are used otherwise
