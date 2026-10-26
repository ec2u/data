---
title: Prompt Testing Log for @extract-google.sys.md
description: |
  Memory for LLM assistants working with the Gemini event extraction prompt.
  Documents behavioral requirements, known issues, and validation procedures.
---

# Overview

This log serves as memory for LLM assistants asked to modify or validate the Gemini event extraction prompt. It is
human-readable documentation, not an automated test suite; see the `prompt-engineer` skill for the validation workflow.

Every observation recorded here rests on the initial test set: the first ten event pages of the Coimbra university
agenda, a single source in a single language, all of them exhibition and recurring-event listings. Counts quoted against
it say what one source does, not what the feeds do. As sources are added, recheck each test case against the new
material and record what varies by source rather than restating the Coimbra reading.

# Inbox

- Entry fees stated where the document states none: a page carrying no price at all comes back `free`, and a page
  reading "de entrada livre, no 4º sábado de cada mês" comes back `free` flat, the condition dropped. Two of the eight
  fee values of the test set are wrong, on a property the prompt already qualifies with "only if absolutely confident";
  decide whether a conditional admission counts as free, and how much firmer the instruction has to be
- Audience answered from nowhere: four pages come back with an audience ("General public", "Adult population and all
  interested parties") that the document nowhere states, one of them loosely backed by a mention of adults; decide
  whether the property is worth keeping if it cannot be sourced
- Times of an event held alongside another: a page announcing an exhibition open 15h00 to 20h00 and an inauguration talk
  at 16h00 comes back with a start time of 16:00, the talk's, which the prompt forbids by name
- Addresses the document states going unreported: a page naming "Pátio da Inquisição" as the venue's whereabouts comes
  back with no address, three of the ten pages carrying one
- Recurring events keeping their session times: a concert series running across some forty dates still comes back with
  the hour its sessions are held at, where a workshop series on the same feed correctly comes back with none; the rule
  is stated plainly, so this is the model applying it unevenly rather than a gap in the wording
- Description scope: the boundary between the descriptive text and the surrounding page furniture is stated as a
  prohibition rather than a definition; decide what belongs in the description for a page that mixes a programme,
  speaker notes and contact details
- Season programmes as description: a concert series answers with its whole programme, a paragraph per date and some
  29,500 characters, which the rules admit as the event's own descriptive text rather than a listing of others; decide
  whether a programme belongs in the description or is carried some other way
- Original texts on long pages: the run behind the Original Texts case read pages under 1,500 characters of
  description; measure a long non-English page, such as a season programme, against the output budget

# Test Cases

## Traceability To The Document

Every payload of the test set was read against the page it was drawn from. The properties standing on what the page
literally carries hold: the venue name, the city, the address where one is reported, the image URL, and the
start and end dates all trace to the document, the venue name keeping the document's own misspellings.

The properties resting on judgment are where the model invents: entry fees, audience, and a start time taken from an
event held alongside the one the page is about. What is fabricated is always plausible and never flagged, and it
survives repeated runs unchanged.

CRITICAL: coverage is not accuracy, and stability is neither. A property answered on ten pages out of ten may still be
wrong on two, as the fees are. Read payloads against their pages before quoting a count as quality.

The title, the summary, the description, the topic and the audience come back in English whatever language the document
is written in, identically across runs, while `language` states the language of the document rather than the English the
properties are stated in. Proper names are left as the document has them: a venue, a street, a city, an image credit,
and a name carried by a title.

A translation carries the whole of what it translates: abridging, summarising, condensing and paraphrasing are forbidden
by name, and a translated description runs as long as its source. Completeness is stated as bearing on the translating
and not on the choosing, since asking for it wholesale invites the description to widen into the page furniture the
prompt keeps out. The output budget was doubled to 16384 tokens to leave room, the longest page of the test set
answering with some 29,500 characters.

CRITICAL: a report that translation shortens the description is most likely a comparison across an edit. Measure the
same page under one revision before and after, never a count carried over from an earlier one.

## Recurring Events Are Events

An event happening more than once is a single event, reported in full.

The rule stating that a recurring event has no times of its own was first worded as carrying "its dates alone", and the
model read it twice as widely as intended: it stripped one page of its description, summary and topic, and it leaked
into the non-event test, marking a permanent exhibition, a concert series and a reading group as `event`
false. Three of ten real events would have been discarded whole. The rule now says it bears on the two times alone, and
the error handling states that recurrence never makes a document `false`.

CRITICAL: this was found while measuring something else. A rule about one property was read as a rule about the whole
record, and the damage showed in properties nobody was looking at. After changing any instruction, read a full payload
and the `event` flag, not only the field the change was aimed at.

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

An earlier form asked for an empty object instead, and the `required` list was dropped so that an empty object would be
legal. The model then answered every page with three properties (`title`, `venueName`, `topic`), no description, no
dates, no language, and cut three replies mid-string. The `required` list is what holds coverage, so the signal had to
become a property rather than an absence.

CRITICAL: never drop `required` to make some other answer expressible. Coverage rests on it, not on the prompt.

## Time Format

Dates come back as `yyyy-mm-dd` and times as `hh:mm:ss`, carrying no zone designator and no fraction of a second.

This rests on the response schema, not on the prompt. The schema states a date and a time as a lexical pattern rather
than as the `date` and `time` formats they would otherwise be drawn from: those formats name the RFC 3339 readings,
which carry a designator, and a model offered one answers a designator even where the values carry no zone at all.
Under the formats every page carrying a time answered `13:00:00.000Z` and the like, and two pages in ninety answered
`16:00:00z`, lowercase, which `xsd:time` rejects outright, so those pages were dropped whole. Under the patterns,
ninety pages and a hundred and two times came back clean.

The prompt cannot carry this. Three wordings were tried against the formats — forbidding fractions and offsets,
stating the standard positively, counting the characters of the answer — and the output was byte-identical each time.
The prompt now simply names the form the schema states, so the two agree.

CRITICAL: what the schema declares decides what the model answers. A prompt pulling against it does not win, it only
makes the answer malformed at the edges. Never restore the `date` and `time` formats in the response schema.

## Times An Event Holds As Its Own

A start or end time is reported only where the document states it as the event's own. A recurring event carries its
dates alone, however plainly the hour of its sessions is named; the hours a venue keeps and the time of a talk given
alongside a longer exhibition are not the event's times either. Four of the ten pages report a start time and three an
end time, the rest stating none of their own.

Three instructions carry this between them, and they pull against each other. The prompt first forbade local notation
outright, which the model read as licence to drop a time stated as `18h30` rather than convert it, so half the pages
carrying times returned none. Asking for the conversion instead recovered them, and had the model report a venue's
opening hours as an exhibition's start and end. Drawing the distinction against opening hours settled that and
suppressed a recurring event's session time, which the rule above then settled deliberately. A first wording of that
rule spoke of an event running over a span of dates rather than a recurring one, which swept up the exhibitions that do
state their own hours and left one page in ten reporting a time.

CRITICAL: a false time is published silently while a missing one is visibly absent, so these instructions are tuned
towards omission. Measure both directions after touching any of them: recall alone will read as an improvement, and
every widening of the wording so far has cost more than it recovered.

## Output Budget

Long pages are answered in full.

At `maxOutputTokens` 4096 the reply was cut mid-string on a page carrying a long body, and the payload failed to parse
as JSON. The budget was raised to 8192.

CRITICAL: a truncated reply surfaces as malformed JSON, not as a quota diagnostic. Read a parse failure on a long page
as an exhausted output budget before suspecting the prompt. A reply that did not finish with `STOP` (withheld as
`RECITATION`, cut short as `MAX_TOKENS`) is logged as an incomplete generation naming its finish reason, and the page is
skipped without a digest, so it is offered again on the next run.

## Postal Code

No postal code is asked for.

The venue postal code was once declared alongside the street address and the city. On Coimbra pages stating none, the
model invented one from the city's `3000-` range and never closed the string (`3000-0000…`, `3000-090 € Coimbra €
Portugal € …`), running a 625-character page out to the 16,384-token budget. A `maxLength` on the property did not
bound it: one page still answered some 6,000 zeros.

CRITICAL: a short, formatted property the document usually omits invites fabrication, and the response schema cannot
bound its length. Measure coverage on pages that omit it before declaring one.

## Description Scope

The description carries the descriptive text of the event alone.

A page whose body listed a season of sessions once yielded a `description` of some 30,000 characters, the page as a
whole rather than the event; the prompt now forbids carrying over navigation, listings of other events, and the page as
a whole, and the same page answers in a few hundred characters.

CRITICAL: this bound rests on the prohibition alone. Nothing in the schema limits the length of a string.

## Current Date

The current date reaches the model as the first content part, a `- date: yyyy-mm-dd` line ahead of the document, and the
date properties resolve relative dates against it. A page stating a day and a month without a year resolves to the
current year.

The prompt carried the date inline instead for a while, through a `{{date}}` placeholder the module substituted before
the request. Stating it as an input keeps the instructions static, which is what lets them be read from a file.

CRITICAL: the date is an input, not part of the instructions. A request built without that content part leaves the model
resolving relative dates against its own idea of today.

## Title Suffix

Pages whose markdown title carries site furniture (`… - Agenda de Coimbra`, `… | unipv.news | The University of Pavia
Magazine`) yield a `title` without it.

This held on the Coimbra test set as model judgment while the prompt asked for no trimming, and stopped holding as soon
as a second source was read: Pavia pages joining the site and magazine names with pipes came back with the whole chain,
which the downstream clip then spent the label budget on. The prompt now names the furniture (site, publication,
section, tagline, breadcrumb), states that the separator does not matter, and points the model at the body heading
where trimming would leave nothing.

Stripping and translating pull against each other, and the first wording of the fallback lost the second: pointed at
the body heading where trimming would leave nothing, the model read the instruction as licence to quote, and one page
of three came back half translated (`… (I Edizione): i reati contro la sfera sessuale`) where the stored title had been
fully English. The bullet now states that stripping settles what to state and never whether to translate it, and all
three pages come back in English.

CRITICAL: a title reads as clean until a source builds its headings another way, and the failure is silent because the
clipped label still looks like a title. Recheck this on every source added, and read the title against the page rather
than against how plausible it looks.

CRITICAL: any instruction pointing the title at a particular piece of the page competes with the English rule, which
sits further down the prompt and does not win by itself. After touching this bullet, read the titles of a non-English
source, not only their trimming.

## Original Texts

A page written in a language other than English yields its title, summary and description twice: in English as
`title`, `summary` and `description`, and as the page words them as `localTitle`, `localSummary` and
`localDescription`. A page written in English yields no original texts.

Read on five pages (two Coimbra in Portuguese, Turku in Finnish, Poitiers in French, Umeå in English): the four
non-English pages return all three originals, every sentence of each original description found verbatim in the page
rather than translated back, and English descriptions within a tenth of the length of the originals; the Umeå page
returns none. A band name (`Os Quatro e Meia`) stays as written in both titles.

CRITICAL: the originals double the length of the longest property, so a page answered within the output budget before
may now run out of it; read an incomplete generation on a long non-English page as budget first.

## Property Set

The prompt asked for a venue city for a while that the response schema did not declare, so the property never came back.
It is now declared, and comes back on every page of the test set.

CRITICAL: the schema in `extract-google.ts` governs what is returned. A property named in the prompt alone is
unreachable, so read the two together on every edit.
