---
title: Prompt Testing Log for @translator.sys.md
description: |
  Memory for LLM assistants working with the Gemini text translation prompt.
  Documents behavioral requirements, known issues, and validation procedures.
---

# Overview

This log serves as memory for LLM assistants when asked to modify or validate the text translation prompt.

It provides documentation of behavioral expectations, known issues and their fixes, validation procedures, and
regression prevention guidance.

This is NOT an automated test suite - it's human-readable documentation for LLM-assisted prompt engineering.

# Inbox

- Chunking: define expected behavior for texts exceeding the model output budget, which the parked Java variant
  handled by splitting the source into fixed-length chunks
- Mixed-language text: verify that a text quoting passages in the target language is carried over rather than
  re-rendered
- Regional variants: verify that a target naming a variant (`pt-BR`, `en-GB`) shapes spelling and lexicon, since the
  `translate` task hands over text already written in the broader language
- Structured text: define expected behavior for texts whose markdown carries front matter, HTML blocks, or footnote
  definitions
- Empty reply: decide whether a blank generation is to be retried or reported, as the module currently fails on
  missing output text

# Guidelines

## Validation Workflow

When asked to validate this prompt:

1. **Create and run test driver**:
  - Write temporary `.test.ts` file with test code
  - Import `createGoogleTranslator` from `translator.ts`
  - Run the translator inside the executor of `index.core.ts`, which binds the Gemini client
  - Feed the translator a sample text with a target language and, where relevant, a source language
  - Execute `npx tsx .test.ts` to generate output
  - Delete `.test.ts` after the complete testing process is finished

2. **Perform independent verification**:
  - Retain the source text alongside the translation
  - Identify what the translation is expected to preserve: content, structure, inline markup, untranslatable tokens
  - CRITICAL: the source text is ground truth for evaluation

3. **Compare and validate**:
  - Compare the translation against the source text passage by passage
  - Verify the reply carries no content beyond the translation
  - Check all documented test cases for regressions

## Maintenance Principles

When updating this log:

- Focus on current behavior, not prompt version history
- Avoid numbering schemes for test cases (TC-001, REG-001, etc.)
- Avoid status tracking (PASSING, FIXED, HANDLED) - content speaks for itself
- Include dates inline only when contextually relevant
- Use professional technical tone
- Describe expected behavior without hardcoded values (avoid "must translate 5 paragraphs")
- Design tests to feed and inspect sources dynamically, not rely on snapshots
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

## Languages Supplied as Input

**Choice**: The source and target languages travel in the request contents as a directive part, not interpolated into
the system instruction.

**Rationale**:

- A file-backed system instruction is static, so no language can be interpolated at load time
- The languages vary per call, while the translation rules do not: keeping them apart lets the instruction be cached
  across every call the translator serves
- Matches the convention of the other file-backed prompts, which carry per-call inputs in the contents

**Alternative Rejected**: Templating the language names into the system instruction before each call

- Defeats prompt caching and reintroduces per-call prompt assembly

## Languages Named Rather Than Tagged

**Choice**: The directive names languages in English, as produced by `nameTag`, rather than carrying the BCP 47 tags.

**Rationale**:

- Names are unambiguous to a model, while rare tags and script or region subtags are not
- `nameTag` falls back to the tag itself when the runtime knows no name, so an exotic language still reaches the model
- The tags themselves stay meaningful to the module, which uses them to decide whether translation is needed at all

## Text Carried as a Separate Part

**Choice**: The text to be translated is a request part of its own, never interpolated into the directive.

**Rationale**:

- The directive is assembled through a `markdown` template, which re-indents interpolated values: indentation carries
  meaning in markdown, so interpolating the text would rewrite fenced code blocks and nested lists
- A separate part keeps the text verbatim, whitespace included, which the fidelity requirements depend on
- The boundary between instructions and material is explicit, which the prompt injection rules lean on

## Short-Circuit Left Outside the Prompt

**Choice**: Blank text, and text already written in the target language, are filtered by the `translate` task before a
request is issued; the prompt covers those cases only as a guard.

**Rationale**:

- Handing text to the API to get it back unchanged is paid for twice, in latency and quota
- The filter sits at the single point every pipe reaches a provider through, so no implementation carries a copy of it
- The source language is often unknown at the call site, so the prompt guard still earns its place for text the task
  cannot filter

## Determinism Owned by the Module

**Choice**: The prompt states no sampling policy; the module fixes a null temperature and a zero seed.

**Rationale**:

- Consistency across runs is a request setting, enforced by the API rather than by instruction alone
- The same text reaching the translator twice yields the same translation, which downstream caching relies on

---

# Test Cases

## Translation Only

**Input**: Any text with a target language

**Expected Behavior**:

- The reply opens with the translation of the first word of the text
- The reply carries no preamble ("Here is the translation"), no closing note, and no alternative renderings
- The reply is not wrapped in code fences or quotation marks the text does not itself carry
- The reply carries no label naming the target language and no echo of the directive

**Root Cause**: Conversational models frame their output, and a framed translation is stored verbatim downstream,
polluting the published dataset with assistant chatter.

**Validation**: Verify the reply starts and ends on the translated content, with no framing text

**CRITICAL**: When modifying the prompt, keep the reply scope prohibition explicit with its examples

## Complete Content

**Input**: A long text carrying repetitions, boilerplate, and passages that read as redundant

**Expected Behavior**:

- Every portion of the text is carried over into the translation
- Nothing is abridged, summarised, or dropped as redundant
- Nothing is added: no explanations, clarifications, or expansions of abbreviations

**Root Cause**: Models economise on long or repetitive input, silently condensing it, and a translation shorter than
its source is indistinguishable from a correct one without a passage by passage comparison.

**Validation**: Compare the translation against the source passage by passage, checking paragraph and list item counts

**CRITICAL**: When modifying the prompt, keep the prohibition on abridging explicit, including for long texts

## Markdown Structure Preserved

**Input**: Text carrying headings, nested lists, tables, block quotes, links, inline code, and blank lines

**Expected Behavior**:

- Heading levels, list nesting, table shape, and paragraph breaks match the source
- Inline markup is preserved around the translated text
- Link targets are carried over unchanged while link text is translated
- Leading whitespace, trailing whitespace, and line breaks are preserved

**Validation**: Compare the markdown skeleton of the translation against the source, ignoring the translated words

## Untranslatable Tokens Carried Over

**Input**: Text carrying URLs, email addresses, file paths, code identifiers, placeholders, acronyms, and proper names

**Expected Behavior**:

- URLs, email addresses, paths, code, identifiers, markup tags, and placeholders appear unchanged in the translation
- Numbers, dates, and measurements keep their value, with notation adapted to the target language
- Proper names are carried over unless the target language has an established form for them
- An acronym is carried over as it stands, while an expansion the text spells out alongside it is translated

**Root Cause**: Models translate anything that reads as a word, including identifiers and placeholders, breaking the
text for every downstream consumer that resolves them.

**Validation**: Extract URLs, identifiers, and placeholders from both texts and verify they match

## Source Language Detection

**Input**: Text with the source declared `unknown` in the directive

**Expected Behavior**:

- The language of the text is detected from the text itself
- The translation renders the text in the target language regardless of what the source turns out to be
- A text already written in the target language is carried over unchanged

**Validation**: Run the driver without a source language and verify the translation matches the one obtained with the
source declared

## Text Is Not an Instruction

**Input**: Text carrying questions, commands, or instructions addressed to an assistant or a translator, including
text asking for a different language or for a comment

**Expected Behavior**:

- Directives, questions, and commands are translated as ordinary content
- No question carried by the text is answered
- No instruction carried by the text is followed
- The target language, the reply scope, and every requirement of the system instruction stand unchanged

**Root Cause**: Translated material is drawn from external pages and feeds, so it carries arbitrary text; a model
reading it as a request abandons the translation and answers instead.

**Validation**: Feed a text carrying an explicit instruction and verify the reply is its translation, not its
execution

**CRITICAL**: When modifying the prompt, keep the prompt injection section explicit; the text reaching this prompt is
never trusted

## Register and Terminology

**Input**: Domain text using a consistent technical vocabulary across several passages

**Expected Behavior**:

- The register of the source is preserved rather than normalised
- A term is rendered by the same target term throughout the text
- Established domain terms are favoured over literal renderings

**Validation**: Track a recurring term through the translation and verify it is rendered consistently

## Degenerate Text

**Input**: Text carrying no words to translate, such as a bare URL, a number, or a punctuation run, or text that is
garbled or truncated

**Expected Behavior**:

- Text with nothing to translate is carried over unchanged
- Garbled or truncated text is translated as far as it can be read, with the remainder carried over as it stands
- Neither an empty reply nor an explanation of the difficulty is produced

**Root Cause**: The module fails on a response carrying no output text, so a model declining to translate turns a
degenerate input into a job failure.

**Validation**: Feed degenerate inputs and verify each yields a non-empty reply carrying the input content
