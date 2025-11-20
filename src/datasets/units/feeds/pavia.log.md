---
title: Prompt Testing Log for @pavia.sys.md
---

# Inbox

- Language variants: if source page switches to English, prompt may need adjustment

# Overview

This log serves as **memory for LLM assistants** when asked to modify the prompt. It provides:

- Documentation of known issues and their fixes
- Behavioral expectations without hardcoded assumptions
- Validation procedures for ensuring correctness
- Regression prevention through explicit warnings

This is NOT an automated test suite - it's human-readable documentation for LLM-assisted prompt engineering.

# Guidelines

## Testing

When asked to validate this prompt:

1. **Create and run temporary test driver**:
    - Use Write tool to create `.test.ts` with test code
   - Import `scan` function from `pavia.ts`
    - Configure test URL and options (structured vs raw output)
    - Execute `npx tsx .test.ts` to generate output
   - Delete `.test.ts` after the complete testing process is finished

2. **Perform independent verification**:
    - Use WebFetch to retrieve the target page
   - **CRITICAL**: Manually and carefully extract reference data from the source
   - Take extra care to identify exactly what should be extracted (active departments, full names, URLs, etc.)
   - Be thorough and precise - this reference data is the ground truth for evaluation

3. **Compare and validate**:
    - Compare script output against independent findings
    - Review documented test cases for known issues

## Maintenance

When updating this log:

- **No versioning**: Don't track prompt versions - focus on current behavior
- **No numbering**: Don't number test cases or regressions (TC-001, REG-001, etc.)
- **No status tracking**: Don't track PASSING/FIXED/HANDLED status - content speaks for itself
- **No dates in headers**: Only include dates inline when contextually relevant
- **No emojis**: Keep professional technical tone
- **No hardcoded expectations**: Describe behavior, not static content (e.g., "17 departments")
- **Dynamic validation**: Tests should fetch and inspect sources, not rely on snapshots
- **Focus on regressions**: Document fixed issues prominently to prevent reintroduction

## Improvement

When asked to improve or fix the prompt:

1. **Add test case if needed**: If the improvement addresses a new requirement or fixes a new issue, add a relevant test
   case to the suite before modifying the prompt

2. **Iteratively modify the prompt**: Make incremental changes to the prompt until the new requirements are met

3. **Validate against all test cases**: Iteratively test that ALL requirements (both new and existing) are met without
   regressions
    - Run the complete test suite
    - If any test fails, modify the prompt and retest
    - Continue until all test cases pass

---

# Test Cases

## Complete Department Extraction

**Input**: https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti

**Expected Behavior**:

- Extract all departments listed on the page
- Each department must have: name (full Italian name) and URL
- No departments should be missing from the output

**Validation**: Use WebFetch to retrieve the page independently and verify all listed departments appear in the
extraction output

## No Acronym Inference

**Input**: https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti

**Expected Behavior**:

- Extract department names only (no acronym fields)
- Do NOT infer acronyms from URL subdomains (e.g., `dbb.dip.unipv.it` should NOT produce "Acronym: dbb")
- Only include acronyms if explicitly stated on the source page

**Root Cause of Past Issues**: Instruction "acronym (optional)" was too vague. LLMs pattern-match URL structures and
infer subdomain = acronym.

**Validation**: Verify the extraction output contains no `acronym` fields unless acronyms are explicitly mentioned on
the source page

**CRITICAL**: When modifying this prompt, ensure acronym extraction instructions remain explicit about NOT inferring
from URLs or department names

## Preserve Quoted Subtitles

**Input**: https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti

**Expected Behavior**:

- Preserve full department names including quoted subtitles
- Example: `Dipartimento di Biologia e Biotecnologie "Lazzaro Spallanzani"` should retain quotes and subtitle text

**Validation**: Verify departments with quoted subtitles (e.g., "Lazzaro Spallanzani") are extracted with their complete
names, including the quotes and subtitle text

## Preserve URL Protocols

**Input**: https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti

**Expected Behavior**:

- Extract URLs exactly as they appear on the source page
- Preserve HTTP vs HTTPS protocols as-is (do not normalize)
- Some departments may use HTTP while others use HTTPS

**Validation**: Compare extracted URLs against the source page and verify protocols (HTTP/HTTPS) match exactly

## Exclude Historical Departments

**Input**: https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti

**Expected Behavior**:

- Extract only current/active departments
- Exclude historical departments (e.g., those active until December 31, 2011)
- The source page mentions "Dipartimenti attivi fino al 31 Dicembre 2011" as a separate document - these should not be
  extracted

**Validation**: Verify the extraction output contains only currently active departments listed on the page, not
historical ones referenced in downloadable documents or archives

## Translate Names to English

**Input**: https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti

**Expected Behavior**:

- All formal names must be translated from Italian to English
- Example: `Dipartimento di Biologia e Biotecnologie "Lazzaro Spallanzani"` should become
  `Department of Biology and Biotechnology "Lazzaro Spallanzani"`
- Preserve quoted subtitles in their original form (e.g., proper names like "Lazzaro Spallanzani" should not be
  translated)
- Translation must be accurate and preserve the full meaning of the original name

**Root Cause of Past Issues**: Without explicit translation instructions, LLMs may leave names in the source language or
inconsistently translate some names but not others.

**Validation**: Verify all formal names in the extraction output are in English, with only proper names (like quoted
subtitles) preserved in their original form

**CRITICAL**: When modifying this prompt, ensure translation instructions explicitly require English output regardless
of source language

## Complete Extraction from Interdepartmental Research Centers

**Input
**: https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-ricerca-interdipartimentali

**Expected Behavior**:

- Extract ALL 19 interdepartmental research centers listed on the page
- Each center must have: formal name (translated to English) and website URL if available
- Systematic scanning required - the page contains multiple sections and entries that may not be in a single list
- No centers should be omitted

**Past Issues**:

- Centro Interdipartimentale di Ricerca per la Storia della Tecnica Elettrica (CIRSTE) was completely missing from
  extraction
- The page lists 19 centers but only 18 were extracted (excluding duplicates and misclassifications)

**Root Cause**: Generic instruction "Make ABSOLUTELY sure to report all units" is insufficient. LLMs need explicit
procedural guidance: systematic scanning steps, verification requirements, and completeness checks. The missing center
demonstrates that even with four-step verification procedures, a center can still be overlooked during extraction.

**Validation**:

1. Use WebFetch to retrieve the page independently
2. Manually count all interdepartmental research centers listed
3. Verify extraction output contains exactly the same number of centers
4. Cross-check each center name appears in the output

**CRITICAL**: When modifying this prompt, ensure completeness verification includes explicit procedural steps:
systematic scanning, counting, and verification requirements. Vague imperatives like "make sure" are insufficient
