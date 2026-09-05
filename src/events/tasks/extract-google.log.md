---
title: Prompt Testing Log for @extract-google.sys.md
description: |
  Memory for LLM assistants working with the Gemini event extraction prompt.
  Documents behavioral requirements, known issues, and validation procedures.
---

# Overview

This log serves as memory for LLM assistants asked to modify or validate the Gemini event extraction prompt. It is
human-readable documentation, not an automated test suite; see the `prompt-engineer` skill for the validation
workflow.

Every observation recorded here rests on the initial test set: the first ten event pages of the Coimbra university
agenda, a single source in a single language, all of them exhibition and recurring-event listings. Counts quoted
against it say what one source does, not what the feeds do. As sources are added, recheck each test case against the
new material and record what varies by source rather than restating the Coimbra reading.

# Inbox

- Time format: the schema pattern is not enforced, so an occasional time still arrives in local notation (`18h30`)
  and the conversion downstream rejects it; decide whether to restate the format in the prompt or normalise on the
  way out
- Runaway description: a page whose body carries long listings yields a `description` of some 30,000 characters,
  the whole page rather than the descriptive text of the event; decide how far the description extends
- Missing times: three of ten pages come back with no `startTime`/`endTime`; establish whether those pages state
  times at all before insisting in the prompt
- Undated years: recurring events resolve to a year the page does not state; establish the intended reading before
  constraining the prompt

# Test Cases

## Time Format

Times are stated as `hh:mm`.

The schema originally declared `format: "time"` on `startTime`/`endTime`, which the model read as RFC 3339 and
answered with `13:00:00-00:00` and `15:30:00.000Z` on every page carrying times; the conversion downstream builds an
instant by concatenation and rejected all of them. The format was replaced by a `^[0-9]{2}:[0-9]{2}$` pattern, which
also lifted time coverage from five pages in ten to seven.

CRITICAL: the pattern steers the model but is not enforced by the API, so a stray `18h30` still gets through. Never
assume a time coming back from the model is well formed.

## Output Budget

Long pages are answered in full.

At `maxOutputTokens` 4096 the reply was cut mid-string on a page carrying a long body, and the payload failed to
parse as JSON. The budget was raised to 8192.

CRITICAL: a truncated reply surfaces as malformed JSON, not as a quota diagnostic. Read a parse failure on a long
page as an exhausted output budget before suspecting the prompt.

## Date Placeholder

The prompt states the current date through a `{{date}}` placeholder, substituted by the module at request time.

CRITICAL: keep the placeholder spelling intact. A renamed or reformatted marker is not substituted, and the model
resolves relative dates against its own idea of today.

## Title Suffix

Pages whose markdown title carries a site or institution suffix (`… - Agenda de Coimbra`, `… - University of
Coimbra`) yield a `title` without it.

The prompt asks for no trimming, so this is model judgment rather than instructed behaviour: an edit that starts
producing the suffix is a change of behaviour, not a regression. Sources vary in how they build page titles, so
recheck this on every source added.

## Property Set

The response schema declared by the module carries no `venueCity`, so the city named in the prompt cannot come back.

CRITICAL: adding it to the prompt alone changes nothing; the schema in `extract-google.ts` governs what is returned.
