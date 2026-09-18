---
title: Prompt Testing Log for @annotate.sys.md
description: |
  Memory for LLM assistants working with the research topic indexing prompt.
  Documents behavioral requirements, known issues, and validation procedures.
---

# Overview

This log serves as memory for LLM assistants when asked to modify or validate the topic indexing prompt.

It provides documentation of behavioral expectations, known issues and their fixes, validation procedures, and
regression prevention guidance.

This is NOT an automated test suite - it's human-readable documentation for LLM-assisted prompt engineering.

# Inbox

- Threshold tuning: Monitor false positives/negatives at 0.6 threshold in production usage

# Guidelines

## Validation Workflow

When asked to validate this prompt:

1. **Create and run test driver**:

- Write temporary `.test.ts` file with test code
- Import `index` function from implementation
- Configure test with sample unit objects (formal, summary, description, keywords)
- Execute `npx tsx .test.ts` to generate output
- Delete `.test.ts` after the complete testing process is finished

2. **Perform independent verification**:

- Manually call `matchTopics` for each keyword individually
- Record returned topic IDs and distances
- Verify matches meet 0.6 threshold
- Identify expected topics based on manual matching
- CRITICAL: These manual results are ground truth for evaluation

3. **Compare and validate**:

- Compare script output against manual matching results
- Verify all topic URLs start with EuroSciVoc taxonomy base
- Check that model called `matchTopics` once per keyword
- Verify no topics were constructed or invented
- Check all documented test cases for regressions

## Maintenance Principles

When updating this log:

- Focus on current behavior, not prompt version history
- Avoid numbering schemes for test cases (TC-001, REG-001, etc.)
- Avoid status tracking (PASSING, FIXED, HANDLED) - content speaks for itself
- Include dates inline only when contextually relevant
- Use professional technical tone
- Describe expected behavior without hardcoded topic counts
- Design tests to call `matchTopics` dynamically
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

**Input**: Unit information with keywords requiring topic matching

**Expected Behavior**:

- Model MUST call `matchTopics` separately for EACH keyword
- Model MUST make parallel calls (one per keyword) for efficiency
- Model MUST use scheme `https://data.ec2u.eu/taxonomies/euroscivoc/`
- Model MUST set threshold 0.6 and limit 1 per call
- Model MUST NOT combine keywords into a single `matchTopics` call
- Model MUST use exact topic IDs returned by `matchTopics`

**Root Cause**: Instructions to "call matchTopics for each keyword" were misinterpreted as combining all keywords into
one text string.

**Validation**: Count `matchTopics` calls and verify each uses single keyword, not combined text

**CRITICAL**: When modifying the prompt, ensure instructions explicitly state "call matchTopics ONCE per keyword" with
parallel execution guidance

## Separate Calls Per Keyword

**Input**: Keywords list: ["Machine Learning", "Robotics", "Data Science"]

**Expected Behavior**:

- Make 3 separate `matchTopics` calls
- Call 1: text="Machine Learning"
- Call 2: text="Robotics"
- Call 3: text="Data Science"
- All calls made in parallel (single turn)
- Each call returns top-1 match if threshold met

**Root Cause**: LLMs may interpret "for each keyword" as preprocessing keywords into combined text rather than separate
API calls.

**Validation**: Verify exactly 3 `matchTopics` calls with individual keyword texts

**CRITICAL**: Ensure prompt explicitly forbids combining keywords and requires separate calls

## Parallel Execution

**Input**: Multiple keywords requiring topic matching

**Expected Behavior**:

- All independent `matchTopics` calls made in parallel (single turn)
- Avoid sequential execution across multiple turns
- Maximize efficiency by batching calls

**Validation**: Verify all `matchTopics` calls appear in single message, not spread across turns

## EuroSciVoc Taxonomy Usage

**Input**: Any unit with research keywords

**Expected Behavior**:

- Topics MUST come from `https://data.ec2u.eu/taxonomies/euroscivoc/`
- NEVER use organizations taxonomy (`https://data.ec2u.eu/taxonomies/organizations/`)
- All returned topic URLs MUST start with EuroSciVoc base

**Validation**: Verify all topic URLs use correct taxonomy base

## Threshold Enforcement

**Input**: Keywords with varying semantic similarity to taxonomy topics

**Expected Behavior**:

- Only accept matches with distance ≤ 0.6
- Reject matches exceeding threshold
- Omit keywords with no acceptable match
- Do NOT lower threshold or force weak matches

**Validation**: Verify matched topics meet 0.6 threshold when independently verified

## Topic ID Verbatim Usage

**Input**: `matchTopics` returns topic IDs

**Expected Behavior**:

- Use returned topic IDs EXACTLY as received
- NEVER truncate, modify, or alter IDs
- NEVER construct topic URLs manually
- NEVER append keywords to base URLs

**Root Cause**: LLMs may attempt to "clean up" or "normalize" URLs, breaking references.

**Validation**: Compare output topic IDs character-by-character with `matchTopics` results

**CRITICAL**: Ensure prompt explicitly requires verbatim usage of returned IDs

## Deduplication

**Input**: Multiple keywords mapping to same topic

**Expected Behavior**:

- Collect all matched topic IDs
- Deduplicate to remove repeated IDs
- Return each unique topic ID once

**Validation**: Verify no duplicate topic IDs in output

## Empty Results Handling

**Input**: Keywords with no taxonomy matches meeting threshold

**Expected Behavior**:

- Omit keywords with no acceptable match
- Do NOT invent or construct topic IDs
- Do NOT report unmatched keywords in output
- Return only successfully matched topics

**Validation**: Verify output contains only topics returned by `matchTopics`

## Keyword Source Utilization

**Input**: Unit with keywords list, summary, and description

**Expected Behavior**:

- Use provided keywords list as primary source
- Optionally supplement with major areas from summary/description
- Focus on major and noteworthy specialty areas
- Extract 5-15 keywords depending on unit breadth

**Validation**: Verify keywords extracted from multiple sources when appropriate

## Parallel Tool Execution

**Input**: Multiple keywords requiring topic matching

**Expected Behavior**:

- Batch all independent `matchTopics` calls in parallel (single turn)
- Avoid sequential execution across multiple turns
- Maximize efficiency by reducing total round trips

**Root Cause**: Sequential API calls increase latency and reduce efficiency.

**Validation**: Review tool call logs to verify all `matchTopics` calls appear in single message, not spread across
turns

**CRITICAL**: When modifying the prompt, ensure parallel execution guidance remains explicit

## All Keywords Fail to Match

**Input**: Unit with keywords that have no good taxonomy matches (all distances > 0.6)

**Expected Behavior**:

- Attempt to match all keywords via `matchTopics`
- Reject all matches exceeding 0.6 threshold
- Return empty Topics list
- Include note: "No topics matched within threshold"
- Do NOT lower threshold to force matches
- Do NOT invent fallback topic IDs

**Validation**: Verify output contains empty Topics list with explanatory note, not constructed IDs

**CRITICAL**: Ensure Zero Tolerance Policy prevents fallback to generated IDs

## Empty Keywords List

**Input**: Unit with empty keywords list and sparse summary/description

**Expected Behavior**:

- Attempt to extract keywords from summary and description
- If extraction yields no usable keywords, return empty Topics list
- Include explanatory note
- Do NOT use unit name as fallback keyword
- Do NOT generate generic research terms

**Validation**: Verify model attempts extraction from alternative sources before returning empty result

## Tool Errors

**Input**: `matchTopics` returns error (network failure, invalid parameters, etc.)

**Expected Behavior**:

- Report the error clearly
- Do NOT attempt to generate fallback topic IDs
- Do NOT proceed with partial results if some calls succeeded
- Request manual intervention
- Maintain Zero Tolerance Policy even during errors

**Validation**: Verify error handling doesn't compromise requirement to use only tool-returned IDs

## Sparse Keyword Extraction

**Input**: Unit with generic keywords list ["research", "innovation", "collaboration"]

**Expected Behavior**:

- Recognize keywords as overly generic
- Extract more specific terms from summary/description
- Prioritize disciplinary terms over broad categories
- Still call `matchTopics` for generic terms but expect weak matches
- Filter by 0.6 threshold as usual

**Validation**: Verify model supplements generic keywords with specific disciplinary terms from description
