---
title: Prompt Testing Log for classify.sys.md
description: |
  Memory for LLM assistants working with the Gemini event classification prompt.
  Documents behavioural requirements, known issues, and validation procedures.
---

# Overview

This log serves as memory for LLM assistants asked to modify or validate the event classification prompt. It is
human-readable documentation, not an automated test suite; see the `prompt-engineer` skill for the validation workflow.

The prompt replaces a nearest-neighbour classifier that ranked an event embedding against every topic of a vocabulary
and stated the closest one. That classifier could not abstain: with the stakeholder vocabulary lying in a 0.068 band
for a page saying nothing about audience, it stated whichever topic happened to win by 0.0096. Judgement now rests
with the model, which reads the vocabularies through `searchTopics` and `browseTopics` and states nothing where the
text gives no ground.

# Inbox

- No run of the reworked prompt has been read yet: every requirement below states an expectation, not an observation.
  Run the Coimbra feed and record what the model actually does before tightening anything.
- The model is `gemini-3.6-flash`, the tier documented for general agentic tasks. `gemini-3.7-flash` is the fallback
  where it drops below the standard set below; `gemini-3.5-flash-lite` was measured and rejected.

# Model Comparison

Three Jena events (all naming their audience) and three Coimbra exhibition pages (none naming one), run under each
tier:

| Model                   | Jena topics | Jena audiences | Coimbra abstention | Browse calls | Wall clock |
|-------------------------|-------------|----------------|--------------------|--------------|------------|
| `gemini-3.7-flash`      | correct     | correct        | 3 of 3             | yes          | ~21 s      |
| `gemini-3.6-flash`      | correct     | correct        | 3 of 3             | yes          | ~20 s      |
| `gemini-3.5-flash-lite` | correct     | correct        | 2 of 3             | none         | ~5 s       |

The lite tier matched the others wherever the page stated an audience, at a quarter of the wall clock. It failed on
the behaviour the design exists for: on "Jews of Coimbra" it stated `third-sector/general-public`, while abstaining on
two near-identical exhibition pages in the same run. The wording arguably supports it ("open to the public for the
first time"), but the inconsistency across three alike pages is the tell: the lite tier settles for the shortlist
rather than weighing it.

It also made no `browseTopics` calls at all, where the other tiers descended into `stakeholders/research` and
`teaching/students` to pick the right level of specificity. The navigation tool is dead weight on a lite tier.
- The event text reaches the prompt as title and description alone. Whether venue, fees and attendance mode would
  sharpen the audience reading is untested.

# Test Cases

## Abstention Where The Text States No Audience

A page describing a permanent museum exhibition, with no word about who it is for, MUST come back with an empty
`audience`. The nearest-neighbour classifier answered `visiting-teaching-staff` for exactly this page, on a margin of
0.0096 over the runner-up.

**CRITICAL**: an audience the text does not support is the defect this prompt exists to fix. Never relax the
abstention requirement to raise coverage.

## Identifiers Copied From Tool Responses

Every identifier stated MUST appear verbatim in a tool response of the same generation. Composed, completed or
recalled identifiers are dropped by the task, which logs `unknown topic <...>`: a warning in the run log is evidence
of this failure, not of a vocabulary gap.

## One Search Per Vocabulary At Least

A generation stating topics without having called `searchTopics` for that vocabulary has answered from memory of the
vocabulary rather than from the vocabulary. Read the call log alongside the payload when validating.

## Distances Are Not Verdicts

Where a search returns candidates standing at much the same distance, the expected behaviour is a second search with
different wording, then abstention. A generation that states the first candidate of a flat shortlist has read the
ranking as a decision, which the requirements forbid.

## Topical Wording Does Not Settle Audience

The audience query MUST be phrased for who the event addresses, not for what it covers. A generation reusing the
topical query for both vocabularies reproduces the failure of the classifier this prompt replaced.
