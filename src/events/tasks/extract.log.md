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

- Missing times: five of ten pages come back with no `startTime` and six with no `endTime`; establish whether those
  pages state times at all before insisting in the prompt
- Description scope: the boundary between the descriptive text and the surrounding page furniture is stated as a
  prohibition rather than a definition; decide what belongs in the description for a page that mixes a programme,
  speaker notes and contact details
- English translation

# Test Cases

## Source URL

The URL is copied verbatim from the `url` field of the frontmatter, query component included, and comes back on every
page of the test set, identical across runs.

The property is required, and while the retrieval URL was reaching the model on a fresh fetch but not on a cache hit,
the model answered with an address it made up rather than leaving the property out: plausible, well formed, stable
across runs, and pointing nowhere. The URL seeds the event identity, so this minted wrong identities silently. The
cause was in the fetch cache, which has been fixed to restate the retrieval URL on a replayed response.

CRITICAL: a required property the input may not carry is a fabrication generator, and a fabrication is as stable as
anything else the model states. When this property looks wrong, read the frontmatter the model was given before
reading the prompt.

## Reproducibility

The same page read three times under the same prompt yields byte-identical payloads, free text included: every one of
the nineteen properties is stable across all ten pages of the test set, with no failure. `seed: 0` and
`temperature: 0` are what carry this, and the model thinks at its own floor (`MINIMAL` for `gemini-3.5-flash-lite`)
without being asked.

Coverage counts quoted in this log therefore describe the prompt, not a sample of it. A count that moves is a
consequence of an edit.

CRITICAL: never read a difference between two runs as noise. Compare only runs made under the same prompt and schema,
and never quote a count across an edit.

## Thinking Budget

`thinkingConfig.thinkingBudget` is rejected by this model with a 400 on every request; the generation states its
thinking as `thinkingConfig.thinkingLevel`, and `MINIMAL` is both the floor and the default.

CRITICAL: thinking cannot be turned off here, only raised. There is nothing to gain by configuring it for
reproducibility, which the seed already carries.

## Non-Event Pages

A document describing no single event is stated as `event: false`. The Coimbra agenda listing page answers
`event: false` with a placeholder title, description and start date, which the schema requires and which the reading
downstream is meant to discard along with the record.

An earlier form asked for an empty object instead, and the `required` list was dropped so that an empty object would
be legal. The model then answered every page with three properties (`title`, `venueName`, `topic`), no description,
no dates, no language, and cut three replies mid-string. The `required` list is what holds coverage, so the signal
had to become a property rather than an absence.

CRITICAL: never drop `required` to make some other answer expressible. Coverage rests on it, not on the prompt.

## Time Format

Times are stated as `hh:mm`.

The schema originally declared `format: "time"` on `startTime`/`endTime`, which the model read as RFC 3339 and
answered with `13:00:00-00:00` and `15:30:00.000Z` on every page carrying times; the conversion downstream builds an
instant by concatenation and rejected all of them. The format was replaced by a `^[0-9]{2}:[0-9]{2}$` pattern, which
left a page answering in local notation (`18h30`), and the prompt now forbids seconds, offsets and local notation by
name.

CRITICAL: the schema pattern steers the model but is not enforced by the API. The prohibition in the prompt is what
carries this behaviour, so never weaken it to save a line.

## Output Budget

Long pages are answered in full.

At `maxOutputTokens` 4096 the reply was cut mid-string on a page carrying a long body, and the payload failed to
parse as JSON. The budget was raised to 8192.

CRITICAL: a truncated reply surfaces as malformed JSON, not as a quota diagnostic. Read a parse failure on a long
page as an exhausted output budget before suspecting the prompt.

## Description Scope

The description carries the descriptive text of the event alone.

A page whose body listed a season of sessions once yielded a `description` of some 30,000 characters, the page as a
whole rather than the event; the prompt now forbids carrying over navigation, listings of other events, and the page
as a whole, and the same page answers in a few hundred characters.

CRITICAL: this bound rests on the prohibition alone. Nothing in the schema limits the length of a string.

## Current Date

The current date reaches the model as the first content part, a `- date: yyyy-mm-dd` line ahead of the document, and
the date properties resolve relative dates against it. A page stating a day and a month without a year resolves to
the current year.

The prompt carried the date inline instead for a while, through a `{{date}}` placeholder the module substituted
before the request. Stating it as an input keeps the instructions static, which is what lets them be read from a
file.

CRITICAL: the date is an input, not part of the instructions. A request built without that content part leaves the
model resolving relative dates against its own idea of today.

## Title Suffix

Pages whose markdown title carries a site or institution suffix (`… - Agenda de Coimbra`, `… - University of
Coimbra`) yield a `title` without it.

The prompt asks for no trimming, so this is model judgment rather than instructed behaviour: an edit that starts
producing the suffix is a change of behaviour, not a regression. Sources vary in how they build page titles, so
recheck this on every source added.

## Property Set

The prompt asked for a venue city for a while that the response schema did not declare, so the property never came
back. It is now declared, and comes back on every page of the test set.

CRITICAL: the schema in `extract-google.ts` governs what is returned. A property named in the prompt alone is
unreachable, so read the two together on every edit.
