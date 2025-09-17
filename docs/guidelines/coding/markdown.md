---
title: Markdown Guidelines
summary: Standards for technical writing and structuring markdown documentation
---

# File Structure

- Include YAML frontmatter with document metadata
- Use `title` property in frontmatter instead of H1 headers for document titles
- Begin content with H1 headers (`#`) after frontmatter

# Frontmatter

## Core Fields

- `title`: Document title (required)
- `summary`: Short one-line description
- `description`: Brief document summary (1 sentence)

## Multi-line Content

Use YAML literal block style with pipe (`|`) for multi-line values:

```yaml
description: |
  This document describes the SKOS vocabulary for representing
  knowledge organization systems within the Semantic Web framework.
```

# Formatting

## Headers

- Use H1 (`#`) for main sections
- Use H2 (`##`) for subsections
- Maintain consistent header hierarchy

## Spacing

- Always include empty lines before and after headings
- Always include empty lines before and after code blocks

# Cross-linking

- Use relative links for internal file references (e.g., `[Java Guidelines](../java.md)`)
- Use proper anchors in target documents for references
- Check cross-links for completeness and correctness

# Writing Style

- Use concise, neutral and technical tone in descriptions
- Revise existing content for completeness, correctness and consistency, but don't otherwise replace it
