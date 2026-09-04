---
title: Prompt Testing Log for @extract.sys.md
description: |
  Memory for LLM assistants working with the academic event extraction prompt.
  Documents behavioral requirements, known issues, and validation procedures.
---

# Overview

This log serves as memory for LLM assistants when asked to modify or validate the event extraction prompt.

It provides documentation of behavioral expectations, known issues and their fixes, validation procedures, and
regression prevention guidance.

This is NOT an automated test suite - it's human-readable documentation for LLM-assisted prompt engineering.

# Inbox

- Entry fees confidence: verify that "only if absolutely confident" does not suppress explicit free-admission
  statements
- Multi-session events: define expected behavior for documents listing several dates or recurring sessions
- Undated years: define expected behavior when the document states day and month without a year
- Implicit attendance mode: decide whether an event with a venue and no attendance statement warrants `offline`
- Description scope: verify that programme listings, speaker biographies, and contact blocks belong in `description`
- Title suffixes: pages whose markdown title carries a site or institution suffix ("… - University of Coimbra") yield
  a `title` including it; decide whether the suffix is to be trimmed
- Venue assembly: `venueName` occasionally accumulates the room, the department and the institution into one string
  instead of naming the venue; decide how far the name extends
- Blank rate: measure how often required properties come back blank across a full feed, as a blank record is a request
  paid for and discarded

# Guidelines

## Validation Workflow

When asked to validate this prompt:

1. **Create and run test driver**:
  - Write temporary `.test.ts` file with test code
  - Import `extract` function from `extract.ts`
  - Configure test with an event page URL and the current date
  - Execute `npx tsx .test.ts` to generate output
  - Delete `.test.ts` after the complete testing process is finished

2. **Perform independent verification**:
  - Use WebFetch to retrieve the target event page
  - Manually extract reference data from the source page
  - Identify expected values (title, dates, times, venue, attendance, fees, image, language)
  - CRITICAL: This reference data is ground truth for evaluation

3. **Compare and validate**:
  - Compare script output against independent findings
  - Verify the extracted properties match the response schema declared by the module
  - Check all documented test cases for regressions

## Maintenance Principles

When updating this log:

- Focus on current behavior, not prompt version history
- Avoid numbering schemes for test cases (TC-001, REG-001, etc.)
- Avoid status tracking (PASSING, FIXED, HANDLED) - content speaks for itself
- Include dates inline only when contextually relevant
- Use professional technical tone
- Describe expected behavior without hardcoded values (avoid "must extract 3 sessions")
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

## Current Date Supplied as Input

**Choice**: The reference date travels in the request contents as a `date` input, not interpolated into the system
instruction.

**Rationale**:

- A file-backed system instruction is static, so no date can be interpolated at build time
- Relative date resolution needs a date that is current at request time, not at module load time
- The parked Java variants disagreed on this point: one rebuilt the prompt per call, the other froze the date at
  instance construction, silently drifting for long-running processes

**Alternative Rejected**: Templating the date into the system instruction before each call

- Defeats prompt caching and reintroduces per-call prompt assembly

## Response Schema Owned by the Module

**Choice**: The prompt describes output properties in prose; the machine-readable schema is declared as
`responseSchema` in the calling module.

**Rationale**:

- Matches the convention of the units tasks (`analyze`, `annotate`, `classify`, `expand`)
- Keeps property types, formats, and the required set enforced by the API rather than by instruction alone
- Prose descriptions can carry extraction conditions ("only if reasonably sure") that a schema cannot express

**CRITICAL**: The required set is what makes extraction complete, and no amount of prompting substitutes for it. A run
with the same prompt against an open schema returned two or three properties from a page stating ten, dropping
`description`, `startDate` and `language` even though the prompt lists them as always provided. Restating the
requirement in the prompt, emphatically and at the end, changed nothing. Never relax `required` to discourage
fabrication: use the two refusal channels below instead.

## Refusal Channels Rather Than an Empty Object

**Choice**: A required set the API enforces leaves the model no way to decline, so refusal travels through two
channels of its own: `documentType` reports what the document actually is, and a blank (`""`) stands for a required
property the document does not state. The calling module drops a record typed `other` and prunes the blanks.

**Rationale**:

- A model forced to fill a required property invents one, and the cheapest invention is the current date
- An empty JSON object, the earlier guard, cannot be produced at all once any property is required
- Both channels cost only the request already paid for, and neither lets an invented value reach the pipe

**Alternative Rejected**: Leaving the required set open so that a non-event page yields an empty object

- Restores the fabrication guard at the cost of extraction itself, as recorded above

## Required Properties Blanked Rather Than Fabricated

**Choice**: When a required property cannot be extracted, the prompt emits an empty string instead of guessing a
value, and the calling module prunes it.

**Rationale**:

- Downstream review rejects incomplete events, so a blank is recoverable while a fabrication is not
- Fabricated dates and titles propagate into the published dataset undetected

## Page Cleaning Left Outside the Prompt

**Choice**: The prompt assumes it receives a cleaned page body and does not instruct the model to skip headers,
footers, and navigation sections beyond a final guard.

**Rationale**:

- The extraction task consumes an already extracted page body, unlike the legacy variant that fed de-tagged raw HTML
- Instructions about page chrome inflate the prompt and compete with the extraction rules

## Event Kind Left Unrestricted

**Choice**: The prompt extracts events of any kind and no longer describes itself as academic.

**Rationale**:

- The feeds it reads are municipal and institutional agendas carrying concerts, exhibitions and fairs alongside
  seminars and conferences
- Asked to judge whether a permanent municipal exhibition was an academic event, the model answered no, which would
  have discarded a page the feed is meant to publish
- Deciding what belongs in the dataset is a selection concern, not an extraction one

## Model Chosen for Completeness Rather Than Price

**Choice**: Extraction runs on the Flash tier at the default thinking level, at roughly two and a half times the input
price of the Lite tier.

**Rationale**:

- Measured over ten pages of the same feed, on identical translated input, Flash returned 52 properties against 42 for
  Lite on the eight pages both completed, and completed a ninth that Lite failed outright
- The gap is concentrated in the properties that make a record usable rather than bare: `summary` came back on 8 pages
  of 8 against 2, and `topic` on 4 of 9 against none at all
- Lite overruns the output token limit on long pages, copying the whole page into `description` until the response is
  truncated and the payload is no longer JSON, which aborts the run rather than dropping the page
- Flash also trims the site suffix from `title`, which Lite carries through
- Holding thinking to its minimum cost three properties on a single page, so the default level is worth its tokens on
  either tier
- See `_gemini-cost.md` for the price and positioning of the current offering

**Alternative Rejected**: The Lite tier, on the strength of a single page measured before the prompt carried the
document type and the blank rule

- That measurement had Flash returning fewer properties and mangling `venueName`; it did not survive a ten-page run
- **CRITICAL**: Never settle the model on one page. Extraction quality varies more across pages than across models, so
  a single document can rank two tiers either way.

**Not Fixed by the Model**: `imageURL` comes back on no page at all on either tier, and end dates are lost on every
page whose date range reaches the prompt with its parts glued together. The first is a prompt or schema gap, the
second an upstream markup one, and neither moves with the model.

---

# Test Cases

## Title Excluded from Description

**Input**: Event page whose body opens with an H1 heading carrying the event title

**Expected Behavior**:

- `title` carries the event title
- `description` contains no H1 (`#`) heading repeating the title
- `description` retains lower-level headings belonging to the descriptive text

**Root Cause**: Markdown renderings open with the page title as an H1, and models copy the document verbatim into the
description, duplicating the title in every published event.

**Validation**: Verify the extracted description does not start with an H1 heading and does not restate the title

**CRITICAL**: When modifying the prompt, keep the prohibition on title headings inside `description` explicit

## Plain Text Summary

**Input**: Event page with rich formatting (links, bold text, lists) in the descriptive text

**Expected Behavior**:

- `summary` is under 500 characters
- `summary` contains no markdown syntax: no links, emphasis, headings, or list markers
- `summary` condenses the description rather than truncating it mid-sentence

**Validation**: Verify the extracted summary length and scan it for markdown control characters

## Relative Date Resolution

**Input**: Event page stating the date in relative terms ("next Thursday", "tomorrow") together with a known current
date

**Expected Behavior**:

- `startDate` resolves the relative expression against the current date provided in the input
- Dates are formatted as ISO `yyyy-mm-dd`
- Times are formatted as ISO `hh:mm` without seconds

**Validation**: Run the driver with a fixed current date and verify the resolved date matches manual computation

**CRITICAL**: When modifying the prompt, keep the reference date an explicit input; never rely on the model's own
notion of today

## End Date Not Inferred

**Input**: Event page stating a start date and time but no end date

**Expected Behavior**:

- `endDate` is omitted
- `endTime` is included only if the document states a closing time
- No end date is derived from the expected duration of the event

**Root Cause**: Models complete date ranges by assuming a default duration, producing end dates the source never
stated.

**Validation**: Verify no end date appears in the output for single-instant events

## Registration Is Not a Paid Entry

**Input**: Event page requiring registration or booking without stating any price

**Expected Behavior**:

- `entryFees` is omitted
- Registration, booking, reservation, and limited-seating statements never map to `paid`
- The absence of a price statement never maps to `free`

**Root Cause**: Models conflate access control with cost: a mandatory registration form reads as a purchase step, and
a page with no price reads as free admission.

**Validation**: Verify events behind a registration form carry no entry fees unless a price or explicit free admission
is stated

**CRITICAL**: When modifying the prompt, keep the registration versus entry fees distinction explicit with its
detection strategy

## Attendance URL Coupled to Attendance Mode

**Input**: Event page for an on-site event linking a registration form and a video platform

**Expected Behavior**:

- `attendanceMode` is `offline`
- `attendanceURL` is omitted
- Remote attendance URLs are included only for `online` and `mixed` events

**Root Cause**: Any meeting or streaming link on the page attracts the attendance URL slot regardless of the stated
attendance mode.

**Validation**: Verify no attendance URL appears whenever attendance mode is `offline`

## Event Image Selection

**Input**: Event page carrying an institutional logo, navigation icons, and one illustrative image with a query
component in its URL

**Expected Behavior**:

- `imageURL` carries the illustrative image, preserving its query component
- Logos, icons, banners, and navigation graphics are never selected as the event image
- `imageCredits` is included only when the page states credits or a copyright notice
- Both properties are omitted when no image is reasonably identifiable

**Validation**: Compare the extracted image URL against the page source, including the query string

## Language Never Extracted

**Input**: Any event page

**Expected Behavior**:

- No `language` property is extracted, and none is declared in the response schema

**Root Cause**: Feeds render pages into a common language before extraction, so a language read off the document
reports the rendering rather than the event. Extracted from a translated page, the property was a constant `en` and
carried nothing.

**Validation**: Verify no language property appears in the output of a feed that translates upstream

**CRITICAL**: The language of an event is a property of the source page, not of the text handed to this prompt. Never
reintroduce it here: it can only be captured before translation.

## Complete Extraction

**Input**: Event page stating a title, a description, a date range, a venue, an image and a topic

**Expected Behavior**:

- Every property the page states is extracted, not the two or three it states most plainly
- `title`, `description`, `startDate` and `language` are present whenever the page states them

**Root Cause**: The omission rules dominate the prompt, and against an open response schema the model reads them as
licence to drop properties the page does state. Emphatic prompting does not counter this; the required set does.

**Validation**: Count the extracted properties against a manual reading of the page, and treat a drop to two or three
as a regression rather than as page-specific variance

**CRITICAL**: When modifying the prompt or the module, keep `title`, `description`, `startDate` and `language` in the
`required` set of the response schema. Removing them silently collapses extraction on every page.

## Required Properties Never Fabricated

**Input**: Event page describing an event but stating no date, or describing it only through an attached document

**Expected Behavior**:

- A required property the page does not state comes back as an empty string and is pruned by the module
- No plausible-looking date, title, or language is synthesised to satisfy the required set
- The current date in particular never appears as a start date the page does not state

**Root Cause**: A required property in a response schema pressures the model to supply a value, and the cheapest value
is an invented one: an undated page reliably drew today's date before the blank was made an explicit option.

**Validation**: Run an undated event page and verify no start date is emitted, in particular not the date supplied as
the reference input

**CRITICAL**: When modifying the prompt, keep the blank explicitly permitted for required properties. The required set
cannot be relaxed to prevent fabrication, so the blank is the only refusal a required property has.

## Non-Event Documents

**Input**: Page listing several events, an institutional landing page, or an error page

**Expected Behavior**:

- `documentType` is `other` and the whole record is discarded by the module
- No properties are extracted from page headers, footers, or navigation sections
- Details of unrelated events mentioned in passing are not merged into a single result
- One entry of a listing is never promoted to stand for the whole document

**Root Cause**: A required set leaves the model no way to return nothing, so a listing page came back as an event
titled after the page, described by its own markup, and dated to the current day.

**Validation**: Run a listing page and an error page and verify both yield no record at all

**CRITICAL**: When modifying the prompt, keep `documentType` required and keep its two values described in terms of
what the document is, never in terms of what the extractor should then do: instructing the model to stop extracting on
`other` suppressed extraction on genuine event pages too.

## Single Event per Document

**Input**: Event page describing one event and cross-linking related upcoming events

**Expected Behavior**:

- Only the event described by the document is extracted
- Cross-linked events do not contribute dates, venues, or titles
- The document is never split into multiple results

**Validation**: Verify the extracted properties all trace back to the primary event on the page
