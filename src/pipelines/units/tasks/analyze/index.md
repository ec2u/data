---
title: Prompt Testing Log for @index.ai
description: |
  Memory for LLM assistants working with the research unit analysis prompt.
  Documents behavioral requirements, known issues, and validation procedures.
---

# Overview

This log serves as memory for LLM assistants when asked to modify or validate the research unit analysis prompt.

It provides documentation of behavioral expectations, known issues and their fixes, validation procedures, and
regression prevention guidance.

This is NOT an automated test suite - it's human-readable documentation for LLM-assisted prompt engineering.

# Inbox

- Multi-language handling: Verify behavior when unit websites switch between languages
- Topic matching accuracy: Monitor false positives/negatives in taxonomy matching
- Website exploration depth: Balance between thoroughness and API call efficiency

# Guidelines

## Validation Workflow

When asked to validate this prompt:

1. **Create and run test driver**:
    - Write temporary `.test.ts` file with test code
   - Import `analyze` function from `index.js`
    - Configure test with sample Lead object containing profile/website URLs
    - Execute `npx tsx .test.ts` to generate output
   - Delete `.test.ts` after the complete testing process is finished

2. **Perform independent verification**:
    - Use WebFetch to retrieve target pages from the Lead
    - Manually extract reference data from source pages
    - Identify expected information (formal name, typology, topics, email, summary)
    - CRITICAL: This reference data is ground truth for evaluation

3. **Compare and validate**:
    - Compare script output against independent findings
   - Verify structured output matches Unit schema requirements
   - Check all documented test cases for regressions

## Maintenance Principles

When updating this log:

- Focus on current behavior, not prompt version history
- Avoid numbering schemes for test cases (TC-001, REG-001, etc.)
- Avoid status tracking (PASSING, FIXED, HANDLED) - content speaks for itself
- Include dates inline only when contextually relevant
- Use professional technical tone
- Describe expected behavior without hardcoded values (avoid "must extract 17 topics")
- Design tests to fetch and inspect sources dynamically, not rely on snapshots
- Document fixed issues prominently to prevent regression

## Improvement Workflow

When asked to improve or fix the prompt:

1. **Add test case if needed**: Document new requirements or issues as test cases before modifying the
   prompt

2. **Make incremental changes**: Modify the prompt iteratively until new requirements are met

3. **Validate without regressions**: Test that ALL requirements (new and existing) are satisfied
    - Run complete test suite
    - If any test fails, modify prompt and retest
    - Continue until all test cases pass

---

# Test Cases

## Complete Information Extraction

**Input**: Lead object with profile and/or website URLs for a research unit

**Expected Behavior**:

- Extract all available unit information from provided URLs
- Follow links to relevant sections (research topics, activities, organization)
- Stop exploration when sufficient information is gathered
- Generate comprehensive plaintext report with all required sections

**Validation**: Retrieve pages independently and verify all extractable information appears in analysis
report

## Formal Name Extraction

**Input**: Any research unit lead

**Expected Behavior**:

- Extract formal, official name of the unit
- Include unit typology (e.g., "Department of Biology", "Computational Physics Laboratory")
- Translate name to English
- Ensure name is standalone and uniquely identifies the unit
- Never include university or parent unit references
- Never report official name as short name
- Never report acronym as short name

**Validation**: Verify extracted name is standalone, includes typology, uses English, and uniquely identifies
the unit

## Personal Information Exclusion

**Input**: Any research unit lead

**Expected Behavior**:

- Extract unit information only
- Strictly exclude all personal information about individuals (staff, researchers, collaborators, faculty,
  directors)
- No personal names, titles, or individual roles should appear

**Root Cause**: LLMs naturally extract prominent information including leadership names and roles. Explicit
prohibition required.

**Validation**: Verify report contains no personal names, titles, or individual roles

**CRITICAL**: When modifying the prompt, ensure personal information prohibition remains explicit and
prominent

## Email Address Extraction

**Input**: Research unit pages with contact information

**Expected Behavior**:

- Only report institutional email addresses found on the pages
- Never use personal email addresses as institutional addresses
- Never invent or infer email addresses
- Remove anti-spam cloaking (e.g., "name(at)example.edu" becomes "name@example.edu")
- Report "Not defined" if no institutional email found

**Validation**: Verify extracted email addresses appear on source pages and are institutional addresses

## Typology Topic Matching

**Input**: Research unit with classification type (e.g., "Department", "Laboratory")

**Expected Behavior**:

- Call `matchTopics` to find best-matching topic ID for unit type
- Use scheme: `https://data.ec2u.eu/taxonomies/organizations/`
- Use focus: `https://data.ec2u.eu/taxonomies/organizations/university-unit`
- Set limit: 1
- Set threshold: 0.5
- Report topic ID as typology value
- Report "Not defined" if no match meets threshold

**Validation**: Verify `matchTopics` called with correct parameters and threshold respected

## Research Topic Matching

**Input**: Research unit with multiple research keywords/areas

**Expected Behavior**:

- Call `matchTopics` once per keyword (not combined)
- Each call uses individual keyword as query text
- Use scheme: `https://data.ec2u.eu/taxonomies/euroscivoc/`
- Set limit: 1 per keyword
- Set threshold: 0.6
- Make parallel calls for efficiency (batch all keywords)
- Deduplicate resulting topic IDs
- Omit keywords with no match meeting threshold

**Root Cause**: Instructions to "call matchTopics for each keyword" were misinterpreted as combining all
keywords into one text string.

**Validation**: Count `matchTopics` calls and verify each uses single keyword, not combined text

**CRITICAL**: When modifying the prompt, ensure instructions explicitly state "call matchTopics ONCE per
keyword" with parallel execution guidance

## Parallel Tool Execution

**Input**: Multiple independent pages to fetch or keywords to match

**Expected Behavior**:

- Batch independent `fetchPage` calls in parallel
- Batch independent `matchTopics` calls in parallel
- Avoid sequential execution unless results are interdependent
- Maximize efficiency by reducing total round trips

**Validation**: Review tool call logs for parallel execution patterns

## Exploration Stopping Conditions

**Input**: Research unit lead with multiple pages to explore

**Expected Behavior**:

- Prioritize pages based on relevance to analysis goals
- Stop when sufficient information gathered for:
    - Unit identity (name, acronym, email)
    - Research topics and activities
- Avoid exhaustive crawling of all linked pages
- Ignore PDFs and other linked documents

**Validation**: Verify exploration stops appropriately without excessive round trips

## Summary and Description Generation

**Input**: Any research unit lead

**Expected Behavior**:

- Summary: approximately 500 characters, concise paragraph
- Description: approximately 250 words, 2-4 paragraphs, standalone document
- Use English translation of unit name
- Focus on unit itself (activities, facilities, objectives)
- Highlight research topics
- Avoid headings in description
- Use neutral, objective tone without hype
- Generate original content (not verbatim copy)
- Avoid abbreviations (use "for instance" not "e.g.")

**Validation**: Verify summary length, description structure, neutral tone, and standalone readability

## Structured Output Generation

**Input**: Analysis report (plaintext)

**Expected Behavior**:

- `structure()` function extracts data into Unit schema
- Include all required fields: formal, type, topics, summary, description, keywords
- Include optional fields (short, acronym, identifier, email) only if defined
- Match schema field types (strings, arrays of strings)
- Topics array contains valid topic IDs
- Keywords array contains free-form terms

**Validation**: Verify structured output matches Unit type definition with all required fields present
