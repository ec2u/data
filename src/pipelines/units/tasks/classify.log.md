---
title: Prompt Testing Log for @classify.sys.md
description: |
  Memory for LLM assistants working with the unit typology classification prompt.
  Documents behavioral requirements, known issues, and validation procedures.
---

# Overview

This log serves as memory for LLM assistants when asked to modify or validate the typology classification prompt.

It provides documentation of behavioral expectations, known issues and their fixes, validation procedures, and
regression prevention guidance.

This is NOT an automated test suite - it's human-readable documentation for LLM-assisted prompt engineering.

# Inbox

- Disambiguation rule coverage: Verify all centre subtypes are properly distinguished
- Edge cases: Test units with ambiguous names (e.g., "Computing Services", "Data Hub")
- Multi-level classification: Ensure most specific typology is selected when multiple levels apply

# Guidelines

## Validation Workflow

When asked to validate this prompt:

1. **Create and run test driver**:

- Write temporary `.test.ts` file with test code
- Import `classify` function from implementation
- Configure test with sample unit objects (formal, summary, description)
- Execute `npx tsx .test.ts` to generate output
- Delete `.test.ts` after the complete testing process is finished

2. **Perform independent verification**:

- Retrieve taxonomy from Google Sheets or via `listTopics` API
- Review organizational structure keywords in unit names
- Apply disambiguation rules manually
- Identify expected typology based on definitions
- CRITICAL: This reference classification is ground truth for evaluation

3. **Compare and validate**:

- Compare script output against independent classification
- Verify typology URL starts with correct taxonomy base
- Check all documented test cases for regressions
- Ensure model called `listTopics` (not `matchTopics`)

## Maintenance Principles

When updating this log:

- Focus on current behavior, not prompt version history
- Avoid numbering schemes for test cases (TC-001, REG-001, etc.)
- Avoid status tracking (PASSING, FIXED, HANDLED) - content speaks for itself
- Include dates inline only when contextually relevant
- Use professional technical tone
- Describe expected behavior without hardcoded values
- Design tests to fetch and inspect taxonomy dynamically
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

# Test Cases

## Tool Usage Requirement

**Input**: Unit information requiring typology classification

**Expected Behavior**:

- Model MUST call `listTopics` tool with scheme `https://data.ec2u.eu/taxonomies/organizations/` and focus
  `https://data.ec2u.eu/taxonomies/organizations/university-unit`
- Model MUST NOT call `matchTopics` for typology classification
- Model MUST select typology from the list returned by `listTopics`
- Model MUST NOT construct, guess, or invent typology URLs

**Root Cause**: Semantic matching via `matchTopics` conflates organizational structure with research domain (e.g.,
matching "Department of Medicine" to `school/medical` instead of `department`).

**Validation**: Verify model calls `listTopics` and retrieves complete typology list before classification

**CRITICAL**: When modifying the prompt, ensure `listTopics` usage remains mandatory and `matchTopics` is explicitly
forbidden for typology

## Department Classification

**Input**: Units with "Department of X" in formal name

**Expected Behavior**:

- Always classify as `university-unit/department`
- NEVER classify as `school/medical`, `school/business`, or other domain-specific types
- Focus on organizational structure ("Department"), not domain ("Medicine", "Business")

**Root Cause**: Taxonomy contains both structural types (`department`) and domain-qualified types (`school/medical`).
Semantic matching prioritizes domain over structure without explicit guidance.

**Validation**: Verify all departments classify as `department` regardless of domain

**Test Examples**:

- "Department of Law" → `department` ✓
- "Department of Medicine" → `department` ✓ (NOT `school/medical`)
- "Department of Political Sciences" → `department` ✓
- "Department of Physics" → `department` ✓

## Centre Disambiguation

**Input**: Units with "Centre" or "Center" in formal name

**Expected Behavior**:

- Analyze summary and description to determine primary function
- **Research Centre**: Active research programs, publications, funded projects
- **Service Centre**: Provides services/resources (testing, analysis, computing, language services)
- **Study and Documentation Centre**: Documentation, archives, historical preservation
- **Interdepartmental Research Centre**: Research coordination across departments
- Select most specific applicable subtype

**Validation**: Verify centre subtypes are correctly distinguished based on primary function

**Test Examples**:

- "University Language Centre" (language services) → `centre/service` ✓
- "Large Instruments Service Centre" (testing services) → `centre/service` ✓
- "Center for Studies on Extra-European Peoples" (documentation, library) → `centre/research/study-documentation` ✓
- "Interdepartmental Research Center for Biology" (active research, interdepartmental) →
  `centre/research/interdepartmental` ✓

## Facility Classification

**Input**: Units providing computational infrastructure or specialized physical resources

**Expected Behavior**:

- **Computing Facility**: HPC clusters, computational infrastructure
- Classify "Computing Cluster", "Computing Services", "HPC Center" as `facility/computing`
- Focus on infrastructure provision, not research activities

**Validation**: Verify infrastructure units classified as facilities, not centres or groups

**Test Examples**:

- "Computing Facility" → `facility/computing` ✓
- "Computing Cluster" → `facility/computing` ✓ (NOT `group`)

## Laboratory Classification

**Input**: Units with "Laboratory" or "Lab" in formal name

**Expected Behavior**:

- Classify as `university-unit/laboratory`
- Physical facilities for experimental work and analysis

**Validation**: Verify laboratory designation recognized

**Test Examples**:

- "Mass Spectrometry Laboratory" → `laboratory` ✓
- "Laboratory of Molecular, Cellular and Tissue Imaging" → `laboratory` ✓
- "Nuclear Magnetic Resonance Spectrometry Laboratory" → `laboratory` ✓

## Specificity Preference

**Input**: Units matching multiple typology levels

**Expected Behavior**:

- Select the MOST SPECIFIC applicable typology
- `centre/research/interdepartmental` over generic `centre/research`
- `facility/computing` over generic `facility`

**Validation**: Verify most specific subtype selected when multiple levels apply

## Missing or Ambiguous Information

**Input**: Unit information insufficient to determine typology confidently

**Expected Behavior**:

- Report "Not defined" if no typology reasonably matches
- Do NOT guess or construct typology URLs
- Prefer reporting missing typology over incorrect classification

**Validation**: Verify model does not generate typologies when uncertain

## Official Name Alignment

**Input**: Units with explicit type designation in formal name

**Expected Behavior**:

- Strongly prefer typology matching the explicit designation in the name
- "Study Center" in name → prefer `study-documentation`
- "Research Center" in name → prefer `research`
- "Service Centre" in name → prefer `service`

**Validation**: Verify typology aligns with explicit type designation in formal name

## Typology Classification Accuracy

**Issue**: Original keyword-only matching ("Cluster") lost critical context, causing misclassifications:

- "Computing Cluster" → matched `group` instead of `facility/computing`
- Departments → matched `school/medical`, `school/business` instead of `department`
- Overall failure rate: ~50% in initial classification attempts

**Solutions Tested**:

1. **Full Context** (FAILED): Used complete name+summary in `matchTopics` → prioritized domain over structure
2. **Minimal Context** (INCONSISTENT): Keyword extraction → unreliable embedding matches, cache issues
3. **Static List** (100%): Load all typologies at startup, pass in contents → adds tokens to every request
4. **Multi-Candidate** (75%): Retrieve top-5 via `matchTopics` → model sometimes ignored candidates
5. **Dynamic Retrieval** (100% - IMPLEMENTED): Model calls `listTopics` tool on demand

**Implemented Solution**:

Created `listTopics` tool for dynamic retrieval. Model calls `listTopics` to retrieve all typologies as structured
objects (id, label, definition).

**Key Principles**:

- Model calls `listTopics(scheme, focus)` to retrieve complete typology list
- DO NOT call `matchTopics` for typology classification
- Focus on ORGANIZATIONAL STRUCTURE (department, school, lab), not domain (medical, business)
- "Department of X" → Always `department`, regardless of X's domain

**Test Results**: 100% accuracy on Computing Cluster, Dept Political Sciences, Dept Medicine, Dept Mathematics

**Root Cause**: Taxonomy has both structural types (`department`) and domain-qualified types (`school/medical`).
Semantic matching without explicit guidance conflates these dimensions.

**Validation**: Verify model calls `listTopics` with scheme `https://data.ec2u.eu/taxonomies/organizations/` and focus
`https://data.ec2u.eu/taxonomies/organizations/university-unit`, retrieves typologies, departments classified as
`department` not `school/*`.

**CRITICAL**: When modifying the prompt, ensure `listTopics` usage remains mandatory and structural vs domain
distinction is explicit
