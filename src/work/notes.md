---
title: University Research Units Data Extraction Problem Statement
summary: Technical requirements for LLM-powered extraction of structured data from university research unit websites
---

# Objective

Extract structured data from approximately 10,000 university research unit websites using Large Language
Models (LLMs) to populate a standardized knowledge base of research facilities and units.

- **Primary Input**: Homepage URL of research unit website
- **Target Scale**: ~10,000 university research unit websites

# Challenges

## Website Structure Variability

- **Single-page websites**: All information contained on homepage
- **Multi-page websites**: Landing page with dedicated subpages for research, publications, contact information,
  with relevant content potentially distributed across multiple interconnected pages
- **Content Management Systems**: Non-hierarchical URL structures (e.g., `https://example.edu/page=123`)
- **Navigation complexity**: Template links mixing relevant subpages with external resources and parent
  institution links
- **Embedding**: The website describing the target unit could be embedded withing a large site (for instance, multiple
  pages describing a laboratory and its facilities in the context of a department website)

## Content Language Constraints

- **Source languages**: Multiple local languages
- **Output requirement**: All extracted data must be translated to English

## LLM Cost-Performance Trade-offs

**Model Categories:**

- **Lightweight models** (Gemini 2.5 Flash Lite, GPT-5 Nano): Optimal cost efficiency, potentially
  insufficient for complex extraction tasks
- **Mid-range models** (Gemini 2.5 Flash, GPT-5 Mini): Balanced cost-performance ratio for main extraction pipeline
- **Reasoning models** (Gemini 2.5 Pro, GPT-5): Optimal performance for complex disambiguation, high
  cost impact at scale

**Cost Optimization Requirements:**

- Implement tiered model selection based on content complexity
- Batch processing for similar extraction tasks
- Context caching for university and department information
- Progressive enhancement from simple to complex models based on confidence scores

# Target Data Schema

## Core Entity Fields

**Research Unit Identification:**

- `university`: Institution affiliation from closed set of 9 European universities
- `formal_name`: Official unit designation
- `short_name`: Common abbreviated name
- `identifier`: Unit acronym or code
- `type`: Classification from reference taxonomy (@categories.md)

**Administrative Information:**

- `head`: Unit director/head (title, given_name, family_name)
- `institutional_email`: Official contact address
- `location`: Geographic location (schema:Location format)

**Research Profile:**

- `description`: Research focus, topics, and activities (English text)
- `research_topics`: Categorized topics from multi-level reference taxonomy

**Organizational Relationships:**

- `parent_units`: Links to department or faculty websites
- `child_units`: Links to laboratory or center websites

## Future Extension Fields

**Publication Management:**

- `publication_catalog`: Links to unit publication listings or external catalog searches

**Resource Management:**

- `resource_catalog`: Links to shared facilities, equipment, or infrastructure
