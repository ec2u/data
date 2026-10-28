---
title: Prompt Testing Log for classify.sys.md
description: |
  Memory for LLM assistants working with the Gemini document classification prompt.
  Documents behavioural requirements, known issues, and validation procedures.
---

# Overview

This log serves as memory for LLM assistants asked to modify or validate the document classification prompt. It is
human-readable documentation, not an automated test suite; see the `prompt-engineer` skill for the validation workflow.

The prompt replaces the nearest-neighbour classifier of the legacy Java loader, which stated the three document types
and the single stakeholder closest to an embedding of the title and description at a cosine distance of at most 0.6.
That classifier ignored the `Type` and `Audience` columns the curated sheets state and could not abstain. The model now
reads the EC2U Documents and EC2U Stakeholders schemes through `searchTopics` and `browseTopics`, takes the sheet columns
as cues, and states nothing where neither the cues nor the text give ground.

# Inbox

- `Personnel` (Turku) names no stakeholder: the scheme has no general staff topic outside research and teaching, so
  staff-wide documents carry no audience. A fix belongs in the stakeholder taxonomy, not in the prompt.
- Rows listing web pages, workshops or programmes rather than documents (Salamanca, Jena, Poitiers `website page`) get
  no type, which is correct for the scheme; whether such rows belong in the dataset at all is a curation decision.
- Jena guidelines addressed to `graduate students` are tagged both `students/phd` and `teaching-staff`: the supervisors
  are read off the description. Untested whether this is wanted.

# Measurements

Run over the 93 titled rows of the curated sheets on 2026-10-28, `gemini-3.6-flash`, `seed: 0`, `temperature: 0`,
concurrency 10. No row failed to classify and no unknown identifier was stated.

| Sheet     | Rows | No type | No audience |
|-----------|-----:|--------:|------------:|
| Iași      |    6 |       0 |           4 |
| Jena      |   12 |       3 |           3 |
| Pavia     |    4 |       0 |           4 |
| Poitiers  |   32 |      12 |           1 |
| Salamanca |   22 |       9 |          17 |
| Turku     |   17 |       0 |           6 |

Totals over all sheets: 24 rows with no type and 35 with no audience. Of the latter, only the two Turku `Personnel`
rows stated an audience cue; every other row was left untagged because neither the sheet nor the text names one.

# Test Cases

## Stated Type Mapped to the Scheme

The sheet's own word for the kind of document is the primary evidence and maps to the concept meaning the same.

- `Regulations` (Jena, general doctoral regulations) → `documents/regulation`
- `roadmap` (Poitiers, open science roadmap) → `documents/strategy/roadmap`
- `Manual` (Turku, research misconduct procedures) → `documents/procedure/manual`
- `Policy` with a domain (Pavia, open access archive policy) → the domain policy, `documents/policy/research`

## No Type for Non-Documents

A row whose stated type names no document kind states no type rather than the closest one.

- `Workshops de ...` (Jena) → no type
- `website page` (Poitiers, the HAL open repository) → no type

## Audience Only on Evidence

- `public` (Poitiers, Turku) → `stakeholders/third-sector/general-public`
- `Researchers` (Turku, open access guide) → `stakeholders/research/researchers`
- `Technology Transfer` (Turku, biomarker guides) → `stakeholders/research/research-support-staff`
- No audience cue and no addressee in the text (Pavia code of ethics) → no audience

**CRITICAL**: an empty audience cue with no addressee in the text MUST yield no audience topic.
