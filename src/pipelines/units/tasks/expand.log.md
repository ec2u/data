---
title: Prompt Testing Log for @expand.sys.md
description: |
  Memory for LLM assistants working with the research unit exploration prompt.
  Documents behavioral requirements, known issues, and validation procedures.
---

# Overview

This log serves as memory for LLM assistants when asked to modify or validate the research unit exploration prompt.

It provides documentation of behavioral expectations, known issues and their fixes, validation procedures, and
regression prevention guidance.

This is NOT an automated test suite - it's human-readable documentation for LLM-assisted prompt engineering.

# Inbox

- Language variants: Verify behavior when source pages switch between languages
- Homepage extraction challenges: Despite multiple explicit requirements and stopping conditions, models inconsistently
  extract homepage URLs from profile page content; may require function calling or structured extraction approach

# Guidelines

## Validation Workflow

When asked to validate this prompt:

1. **Create and run test driver**:
    - Write temporary `.test.ts` file with test code
   - Import `expand` function from `expand.ts`
    - Configure test with URL and run options
    - Execute `npx tsx .test.ts` to generate output
   - Delete `.test.ts` after the complete testing process is finished

2. **Perform independent verification**:
    - Use WebFetch to retrieve target pages
    - Manually extract reference data from source pages
    - Identify expected information (subunits, names, URLs, summaries)
    - CRITICAL: This reference data is ground truth for evaluation

3. **Compare and validate**:
    - Compare script output against independent findings
   - Verify structured output matches Lead schema requirements
   - Check all documented test cases for regressions

## Maintenance Principles

When updating this log:

- Focus on current behavior, not prompt version history
- Avoid numbering schemes for test cases (TC-001, REG-001, etc.)
- Avoid status tracking (PASSING, FIXED, HANDLED) - content speaks for itself
- Include dates inline only when contextually relevant
- Use professional technical tone
- Describe expected behavior without hardcoded values (avoid "must extract 35 labs")
- Design tests to fetch and inspect sources dynamically, not rely on snapshots
- Document fixed issues prominently to prevent regression

## Improvement Workflow

When asked to improve or fix the prompt:

1. **Add test case if needed**: Document new requirements or issues as test cases before modifying the prompt

2. **Make incremental changes**: Modify the prompt iteratively until new requirements are met

3. **Validate without regressions**: Test that ALL requirements (new and existing) are satisfied
    - Run complete test suite
    - If any test fails, modify prompt and retest
    - Continue until all test cases pass

---

# Design Decisions

## Single-Level Extraction with Application-Level Recursion

**Choice**: Make the model report only direct subunits, handle recursion in application code

**Rationale**:

- Simpler prompt instructions (single responsibility)
- Better control over recursion depth and termination
- Easier to cache and optimize individual calls
- More predictable token usage

**Alternative Rejected**: Having the model recursively explore all nested levels in one call

- Would make prompt more complex
- Harder to control and debug
- Less predictable performance

## Profile and Website as Separate Optional Fields

**Choice**: Two optional URL fields instead of a single required URL

**Rationale**:

- Some units have only institutional profiles
- Some units have only self-managed websites
- Many units have both
- Explicit separation makes the distinction clear and preserves both when available

---

# Test Cases

## Basic Laboratory Listing

**Input**: https://iii.dip.unipv.it/it/ricerca/laboratori-di-ricerca

**Description**: Engineering department with comprehensive laboratory listing on a single page.

**Expected Behavior**:

- Extract all laboratories listed on the page
- Identify website URLs for labs with subdomain sites (e.g., lab-bioinfo.unipv.it, vision.unipv.it)
- Recognize subdomains as websites, not profiles
- Generate summaries for each laboratory (~100 chars)

**Key Issues Tested**:

- Complete extraction from listing pages
- Missing website URLs when directly visible in listing
- Subdomain confusion (treating subdomains as profiles vs websites)
- Summary generation and length requirement

## Research Themes vs Actual Labs

**Input**: https://dbb.dip.unipv.it/it

**Description**: Biology department organizing research by thematic areas, with actual labs nested under themes.

**Expected Behavior**:

- Navigate to research themes/laboratories page
- Recognize thematic grouping pages (e.g., "Bioinformatics and Big Data", "Neurofarmacologia") as organizational
  structures, not actual units
- Explore theme pages to find actual laboratories underneath
- Extract actual labs nested under themes
- MUST fetch each lab's profile page to find website links
- Extract website URLs from profile page content when available

**Key Issues Tested**:

- Distinguishing research themes from actual structural units
- Exploring theme pages to find labs underneath
- Not reporting themes as units
- Website links embedded in lab profile pages (currently inconsistent)
- Multi-level structure: department → themes → labs
- Fetching individual profile pages for each identified lab

## Nested Subunits

**Input**: https://dbbs.dip.unipv.it/it/ricerca/attivita-di-ricerca/linee-e-temi-di-ricerca/unita-di-neurodiagnostica

**Description**: Research unit with explicitly listed nested subunits (sotto-unità).

**Expected Behavior**:

- Report ONLY direct subunits of the input unit
- MUST NOT include nested subunits in the output
- Application code handles recursive exploration
- Identify immediate child units without traversing deeper hierarchy

**Key Issues Tested**:

- Single-level vs multi-level extraction
- Explicit exclusion of nested subunits from single call
- Application-level recursion design

**Root Cause**: Without explicit single-level constraint, models may attempt to recursively extract all nested levels,
complicating prompt logic and reducing control.

**CRITICAL**: When modifying the prompt, ensure single-level extraction constraint remains explicit and prominent

## Research Centers vs External Collaborations

**Input**: https://giurisprudenza.dip.unipv.it/it/ricerca/persone-e-network/gruppi-e-centri-di-ricerca

**Description**: Law department with research centers that are structural subunits.

**Expected Behavior**:

- Include research centers that are "part of" the department
- Exclude external collaborations or coordinating bodies the unit participates in
- Extract both profile (institutional page) and website URLs when available
- Verify structural belonging before including as subunit

**Key Issues Tested**:

- Research centers not being excluded as "coordinating bodies"
- Distinguishing "our centers" from "centers we participate in"
- Both profile and website extraction for centers

**Root Cause**: Research centers can be ambiguous - some are structural subunits, others are external partnerships.
Explicit "belonging" criteria needed.

## Multi-Level Navigation

**Input**: https://giurisprudenza.dip.unipv.it/

**Description**: Department where research groups page is not directly linked from website.

**Expected Behavior**:

- Explore intermediate navigation pages
- From intermediate pages, identify and fetch listing pages
- MUST NOT assume website directly links to all content
- Navigate through: section pages → subsection pages → listing pages
- Follow navigation hierarchy to find comprehensive subunit listings

**Key Issues Tested**:

- Multi-level exploration requirement
- Intermediate navigation page handling
- Not relying solely on homepage content

**Root Cause**: Websites may organize content hierarchically with multiple navigation levels before reaching actual
listings. Prompt must encourage exploration beyond immediate links.

## Individual People vs Research Units

**Input**: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/

**Description**: Institute with staff/team pages that should NOT be reported as research units.

**Expected Behavior**:

- Navigate to team/staff pages
- Recognize URLs like `/team/gruber/` as individual person's profile pages
- MUST NOT report personal pages, staff profiles, or professorships as research units
- Only report actual organizational units (labs, groups, divisions)
- Distinguish between "Prof. X's research group" (a unit) and "Prof. X" (a person)

**Key Issues Tested**:

- Excluding individual people's pages from results
- Distinguishing administrative roles/positions from organizational units
- Not confusing "Professur für..." (professorship held by a person) with an actual research unit

**Root Cause**: Team/staff pages are often prominently linked and may appear to be organizational units. Explicit
exclusion of individual person pages required.

**CRITICAL**: When modifying the prompt, ensure individual people exclusion remains explicit and prominent

## University-Wide Centers vs Departmental Units

**Input**: https://iii.dip.unipv.it/

**Description**: Engineering department that lists both its own labs and university-wide interdepartmental centers.

**Expected Behavior**:

- Report departmental labs
- MUST NOT report university-wide centers (e.g., language centers, interdepartmental commissions)
- Recognize that interdepartmental/university-wide centers exist at a higher organizational level
- Only report units that structurally belong to the department

**Key Issues Tested**:

- Distinguishing departmental units from university-wide centers
- Not reporting interdepartmental centers as direct subunits
- Understanding organizational hierarchy (department < university)

**Root Cause**: Departments often list university-wide services and interdepartmental centers for convenience.
Explicit organizational level checking required.

**CRITICAL**: When modifying the prompt, ensure university-wide/interdepartmental center exclusion remains explicit

## Empty Results

**Description**: Units with no structural subunits.

**Expected Behavior**:

- Return empty list `[]`
- This is valid and acceptable
- MUST NOT force false positives

**Key Issues Tested**:

- Explicit empty list handling
- Avoiding forced extraction when no subunits exist

**Root Cause**: Without explicit guidance, models may feel compelled to return some results even when none exist,
leading to false positives.

## Parallel Tool Execution

**Input**: Any unit with multiple subunits or pages to fetch

**Expected Behavior**:

- Batch independent `fetchPage` calls in parallel
- Fetch multiple subunit profile pages simultaneously when possible
- Avoid sequential execution unless results are interdependent
- Maximize efficiency by reducing total round trips

**Key Issues Tested**:

- Parallel execution patterns
- Efficient use of tool calling
- Minimizing latency through concurrent fetching

**Validation**: Review tool call logs for parallel execution patterns

## Structured Output Generation

**Input**: Exploration report (plaintext)

**Expected Behavior**:

- `structure()` function extracts data into Lead schema
- Include required fields: name, summary
- Include optional fields (profile, website) only when available
- Profile and website fields must be valid URLs when present
- Summary must be approximately 100 characters
- All fields must match schema types (strings)

**Key Issues Tested**:

- Structured output conformance to schema
- Required vs optional field handling
- URL validity
- Summary length constraint

**Validation**: Verify structured output matches Lead type definition with all required fields present

## External Collaborations vs Internal Research Lines

**Input**: https://fisica.dip.unipv.it/

**Description**: Physics department with internal research lines and extensive external collaboration experiments (
ATLAS, CMS, MEG, etc. at CERN, PSI, Fermilab).

**Expected Behavior**:

- Report ONLY internal research lines (6 lines: Didactics/History, Applied Physics, Experimental/Theoretical Condensed
  Matter, Experimental/Theoretical Fundamental Interactions)
- MUST NOT report external experiments/collaborations (ATLAS, CMS, MEG, MUonE, RD_FCC, RD_MUCOL, ICARUS, HERD, ALICE,
  FAMU, MAMBO)
- Recognize indicators of external collaborations:
  - Different institutional domains (atlas.cern, cms.cern, psi.ch, fnal.gov)
  - Language like "participate in", "collaborate with", "member of"
  - Hosted at external facilities
  - Multi-institutional membership
- All reported units should have URLs on department domain (fisica.dip.unipv.it)

**Key Issues Tested**:

- Distinguishing internal structural units from external collaborations
- Domain-based detection of external organizations
- Language-based detection (collaboration indicators)
- Not reporting prominently featured international experiments as subunits
- Understanding "participate in" vs "part of" distinction

**Root Cause**: Research departments often prominently feature international collaborations and experiments they
participate in. Without explicit guidance, models may report these as structural subunits rather than external
partnerships.

**CRITICAL**: When modifying the prompt, ensure external collaboration exclusion remains explicit with domain checking
and language indicators
