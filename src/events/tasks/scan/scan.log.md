---
title: Prompt Testing Log for @scan.sys.md
description: |
  Memory for LLM assistants working with the academic event scanning prompt.
  Documents behavioral requirements, known issues, and validation procedures.
---

# Overview

This log serves as memory for LLM assistants when asked to modify or validate the event scanning prompt.

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

# Guidelines

## Validation Workflow

When asked to validate this prompt:

1. **Create and run test driver**:
  - Write temporary `.test.ts` file with test code
  - Import `scan` function from `scan.ts`
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

## Required Properties Omitted Rather Than Fabricated

**Choice**: When a required property cannot be extracted, the prompt omits it instead of guessing a value.

**Rationale**:

- Downstream review rejects incomplete events, so an omission is recoverable while a fabrication is not
- Fabricated dates and titles propagate into the published dataset undetected

## Page Cleaning Left Outside the Prompt

**Choice**: The prompt assumes it receives a cleaned page body and does not instruct the model to skip headers,
footers, and navigation sections beyond a final guard.

**Rationale**:

- The scanning task consumes an already extracted page body, unlike the legacy variant that fed de-tagged raw HTML
- Instructions about page chrome inflate the prompt and compete with the extraction rules

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

## Language from Descriptive Text

**Input**: Event page whose navigation chrome is in English while the event description is in the local language

**Expected Behavior**:

- `language` matches the language of the descriptive text, not of the page chrome
- The value is a lowercase 2-letter ISO tag

**Validation**: Verify the extracted tag matches the language of the extracted description

## Required Properties Never Fabricated

**Input**: Event page missing a start date, or describing the event only through an attached document

**Expected Behavior**:

- Missing required properties are omitted rather than guessed
- No plausible-looking date, title, or language is synthesised to satisfy the required set

**Root Cause**: A required property in a response schema pressures the model to supply a value, and the cheapest
value is an invented one.

**Validation**: Verify output for incomplete pages omits the unavailable required properties

**CRITICAL**: When modifying the prompt, keep the preference for omission over fabrication explicit

## Non-Event Documents

**Input**: Page listing several events, an institutional landing page, or an error page

**Expected Behavior**:

- An empty JSON object is returned
- No properties are extracted from page headers, footers, or navigation sections
- Details of unrelated events mentioned in passing are not merged into a single result

**Validation**: Verify non-event pages yield no extracted properties

## Single Event per Document

**Input**: Event page describing one event and cross-linking related upcoming events

**Expected Behavior**:

- Only the event described by the document is extracted
- Cross-linked events do not contribute dates, venues, or titles
- The document is never split into multiple results

**Validation**: Verify the extracted properties all trace back to the primary event on the page
