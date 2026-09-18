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
- Configure test with sample unit objects (formal, summary)
- Execute `npx tsx .test.ts` to generate output
- Delete `.test.ts` after the complete testing process is finished

2. **Perform independent verification**:

- Retrieve taxonomy from Google Sheets or via `matchTopics` API
- Review organizational structure keywords in unit names
- Apply disambiguation rules manually
- Identify expected typology based on definitions
- CRITICAL: This reference classification is ground truth for evaluation

3. **Compare and validate**:

- Compare script output against independent classification
- Verify typology URL starts with correct taxonomy base
- Check all documented test cases for regressions
- Ensure model called `matchTopics` with correct parameters (limit=5, formal+summary)
- Verify model applied classification rules to select from top-5 candidates

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

**Input**: Unit information requiring typology classification (formal name and summary)

**Expected Behavior**:

- Model MUST call `matchTopics` tool with:
	- `text`: combined formal name and summary (joined with `\n\n`)
	- `scheme: "https://data.ec2u.eu/taxonomies/organizations/"`
	- `focus: "https://data.ec2u.eu/taxonomies/organizations/university-unit"`
	- `limit: 5` (retrieve top 5 candidates)
	- `tolerance: 0.15` (relative tolerance from best match)
	- `narrowing: 1.05` (slightly penalize over-specific typologies)
- Model MUST review the top 5 returned candidates
- Model MUST apply classification rules to select the best match from candidates
- Model MUST select typology from the list returned by `matchTopics`
- Model MUST NOT construct, guess, or invent typology URLs

**Rationale**: Hybrid approach combining semantic similarity (for candidate generation) with rule-based selection
(for structural correctness). Semantic matching identifies relevant candidates; classification rules ensure structural
signals (e.g., "Department") override content signals (e.g., "Medicine").

**Validation**: Verify model calls `matchTopics` with correct parameters, retrieves top 5 candidates, and applies
classification rules to select the best match

**CRITICAL**: When modifying the prompt, ensure the hybrid approach is maintained - semantic matching for candidates,
rule-based selection for final choice

## Department Classification

**Input**: Units with "Department of X" in formal name

**Expected Behavior**:

- Model retrieves top-5 candidates via `matchTopics` (may include `school/medical`, `department`, etc.)
- Model applies type descriptor mapping rule: "Department" → `department`
- Final classification is ALWAYS `university-unit/department`
- NEVER select `school/medical`, `school/business`, or other domain-specific types from candidates
- Focus on organizational structure ("Department"), not domain ("Medicine", "Business")

**Root Cause**: Taxonomy contains both structural types (`department`) and domain-qualified types (`school/medical`).
Pure semantic matching prioritizes domain over structure. Hybrid approach corrects this via explicit rules.

**Validation**: Verify all departments classify as `department` regardless of domain, even when `school/*` appears in
top-5 candidates

**Test Examples**:

- "Department of Law" → `department` ✓
- "Department of Medicine" → `department` ✓ (NOT `school/medical`)
- "Department of Political Sciences" → `department` ✓
- "Department of Physics" → `department` ✓

## Centre Disambiguation

**Input**: Units with "Centre" or "Center" in formal name

**Expected Behavior**:

- Model retrieves top-5 candidates via `matchTopics` (may include various `centre/*` subtypes)
- Model analyzes summary to determine primary function
- Model applies disambiguation rules to select most specific subtype:
	- **Research Centre**: Active research programs, publications, funded projects
	- **Service Centre**: Provides services/resources (testing, analysis, computing, language services)
	- **Study and Documentation Centre**: Documentation, archives, historical preservation
	- **Interdepartmental Research Centre**: Research coordination across departments
- Final classification selects most specific applicable subtype from candidates

**Validation**: Verify centre subtypes are correctly distinguished based on primary function, and most specific subtype
is selected when multiple appear in candidates

**Test Examples**:

- "University Language Centre" (language services) → `centre/service` ✓
- "Large Instruments Service Centre" (testing services) → `centre/service` ✓
- "Center for Studies on Extra-European Peoples" (documentation, library) → `centre/research/study-documentation` ✓
- "Interdepartmental Research Center for Biology" (active research, interdepartmental) →
  `centre/research/interdepartmental` ✓

## Facility Classification

**Input**: Units providing computational infrastructure or specialized physical resources

**Expected Behavior**:

- Model retrieves top-5 candidates via `matchTopics`
- Model identifies infrastructure keywords in formal name and summary
- **Computing Facility**: HPC clusters, computational infrastructure
- Classify "Computing Cluster", "Computing Services", "HPC Center" as `facility/computing`
- Focus on infrastructure provision, not research activities
- Apply disambiguation to prefer `facility` over `centre` or `group` when infrastructure is primary function

**Validation**: Verify infrastructure units classified as facilities, not centres or groups, even when ambiguous names
like "Computing Cluster" might suggest other types

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

- Model retrieves top-5 candidates via `matchTopics` (may include multiple specificity levels)
- Model applies specificity preference rule: select MOST SPECIFIC applicable typology
- Examples:
	- `centre/research/interdepartmental` over generic `centre/research` or `centre`
	- `facility/computing` over generic `facility`
	- `centre/research/study-documentation` over generic `centre/research`
- Specific subtypes provide more precise organizational classification

**Validation**: Verify most specific subtype selected when multiple levels appear in top-5 candidates

## Missing or Ambiguous Information

**Input**: Unit information insufficient to determine typology confidently

**Expected Behavior**:

- Model calls `matchTopics` to retrieve top-5 candidates
- If `matchTopics` returns no results, report "Not defined"
- If candidates returned but none match classification rules, report "Not defined"
- Do NOT guess or construct typology URLs
- Do NOT force-select a candidate if classification rules indicate none are appropriate
- Prefer reporting missing typology over incorrect classification

**Validation**: Verify model does not generate typologies when uncertain, even when candidates are available

## Official Name Alignment

**Input**: Units with explicit type designation in formal name

**Expected Behavior**:

- Strongly prefer typology matching the explicit designation in the name
- "Study Center" in name → prefer `study-documentation`
- "Research Center" in name → prefer `research`
- "Service Centre" in name → prefer `service`

**Validation**: Verify typology aligns with explicit type designation in formal name

## Typology Classification Accuracy

**Issue**: Original approaches had accuracy problems across different dimensions:

- Keyword-only matching: "Computing Cluster" → matched `group` instead of `facility/computing`
- Pure semantic matching: Departments → matched `school/medical`, `school/business` instead of `department`
- Formal name only (semantic): 61.5% accuracy baseline
- Formal + summary (semantic): 57.7% accuracy (worse - content noise dilutes structural signals)

**Solutions Tested**:

1. **Full Context Semantic** (FAILED - 51.9%): Used complete name+summary+description → domain overwhelms structure
2. **Minimal Context** (INCONSISTENT): Keyword extraction → unreliable embedding matches
3. **Static List** (100% but impractical): Load all typologies → adds excessive tokens to every request
4. **Multi-Candidate Semantic** (75%): Retrieve top-5 via `matchTopics` → model sometimes ignored candidates
5. **Dynamic Retrieval** (100% on small set): Model calls `listTopics` tool → perfect on test set
6. **Hybrid Semantic + Rules** (90.4% in top-5 - IMPLEMENTED): Semantic matching for candidates, rules for selection

**Implemented Solution**:

Hybrid approach combining strengths of semantic matching and rule-based classification:

1. **Semantic candidate generation**: Call `matchTopics` with formal name + summary to retrieve top-5 candidates

- Parameters: `limit=5`, `tolerance=0.15`, `narrowing=1.05`
- 90.4% of correct answers appear in top-5 (verified on 52 University of Pavia units)

2. **Rule-based selection**: Model applies classification principles to select best match from candidates

- Type descriptor mapping prioritizes structural signals ("Department" → `department`)
- Disambiguation rules resolve conflicts between semantic match and formal name
- Specificity preference ensures most appropriate subtype is selected

**Key Principles**:

- Semantic matching provides candidates, classification rules select the winner
- Focus on ORGANIZATIONAL STRUCTURE (department, school, lab), not domain (medical, business)
- "Department of X" → Always `department`, regardless of X's domain
- If formal name indicates one type but semantic match suggests another, prefer formal name's type descriptor

**Performance Data** (52 University of Pavia units):

- Formal name only (pure semantic): 61.5% rank-1, 86.5% in top-3
- Formal + summary (pure semantic): 57.7% rank-1, 90.4% in top-5
- Expected with hybrid approach: >70% (semantic candidates + rule-based selection)

**Root Cause**: Taxonomy has both structural types (`department`) and domain-qualified types (`school/medical`). Pure
semantic matching conflates these dimensions. Hybrid approach uses semantic similarity for candidate generation while
preserving structural reasoning via explicit rules.

**Validation**: Verify model calls `matchTopics` with correct parameters (limit=5, formal+summary), retrieves top-5
candidates, applies classification rules, and departments classify as `department` not `school/*`.

**CRITICAL**: When modifying the prompt, maintain the hybrid approach - semantic matching must generate candidates, but
classification rules must govern final selection. Never allow pure semantic ranking without rule application.
