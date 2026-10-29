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
with the model, which reads the vocabulary through `searchTopics` and `browseTopics` and states nothing where the text
gives no ground.

Subject, format and audience are three branches of the single `EC2U Events` scheme, stated together under `keywords`
and told apart by the branch a topic descends from. The `EC2U Stakeholders` scheme no longer classifies events: it maps
parties with an interest in the institution (funding bodies, regulators, publishers), which is not who turns up to a
lecture, and its student branch splits on enrolment status that no event page states.

# Inbox

- An audience phrase the extractor left untranslated (`discussione aperta con il pubblico interessato`) is missed on
  every run; the extractor leaves one page in seven untranslated, so this reaches production. The prompt already asks
  for meaning over wording; a fix belongs upstream, in the extractor's translation.
- The generation is not deterministic under `seed: 0` and `temperature: 0`: the tool loop reorders calls, and a
  quarter of the cases gain or lose a topic between two runs of the same prompt. Read any change against two runs.
- A generation that never settles (the lite tier browsed invented identifiers until the 50-call ceiling) aborts the
  whole feed: `classify()` lets the `maximum turns` error propagate, so one runaway page takes the sync run with it.
  Untouched here; whether a page that cannot be classified should be stated with no topics is a pipeline decision.
- Browse calls run to 3 per case against 3.7 searches: the model walks the scheme as much as it searches it. Wall
  clock is ~2.5 s per case at concurrency 10.
- The event text reaches the prompt as title and description alone. Whether venue, fees and attendance mode would
  sharpen the audience reading is untested.

# Measurements

Runs over the 77-case sample of `classify.json` on 2026-10-26, `seed: 0`, `temperature: 0`, concurrency 10 (the first
two at 5). Scored per branch under the final expectations: a branch passes where every required topic (or one of its
alternatives) is stated and nothing forbidden or unexpected is; a case passes where all three branches do. Every
figure below was re-scored under the same expectations, so the rows compare.

| Revision                                              | Model                   | Cases | Subject | Format | Audience | Topics | Wall clock |
|-------------------------------------------------------|-------------------------|------:|--------:|-------:|---------:|-------:|-----------:|
| baseline, run 1                                       | `gemini-3.6-flash`      | 67/77 |      74 |     74 |       71 |    249 |      278 s |
| baseline, run 2                                       | `gemini-3.6-flash`      | 66/77 |      74 |     74 |       70 |    253 |      297 s |
| A: most specific topic of a chain                     | `gemini-3.6-flash`      | 73/77 |      76 |     76 |       73 |    242 |      190 s |
| B: audience evidence is an invitation, not a price    | `gemini-3.6-flash`      | 72/77 |      76 |     75 |       73 |    246 |      191 s |
| C: `a public event`, `public: yes` added as evidence  | `gemini-3.6-flash`      | 69/77 |      73 |     74 |       73 |    246 |      197 s |
| D: one subject per facet; a format for every event    | `gemini-3.6-flash`      | 74/77 |      77 |     76 |       75 |    226 |      186 s |
| D                                                     | `gemini-3.8-flash`      | 73/77 |      75 |     77 |       73 |    205 |      357 s |
| D                                                     | `gemini-3.5-flash-lite` | aborted: a generation hit the 50-call ceiling browsing invented identifiers |||||
| E: D with ancestors and top concepts pruned by the task | `gemini-3.6-flash`    | 75/77 |      76 |     77 |       76 |    221 |      198 s |

Revision E is what ships: 74 and 75 of 77 across its two runs (D and E differ only in the pruning step, which touched
no case of run E), against 67 and 66 for the baseline. The subject branch went from 121 stated topics on 34
multi-subject cases to 89 on 15, with no unexpected subject left; the format branch lost its bare `format/talks`
parents; the audience branch lost every `audience/public` read off a fee line. No top concept and no unknown
identifier was stated in any run of revision E.

**Noise floor**: 24 to 28 of 77 cases differ between two runs of the same prompt. Every difference is a topic added or
dropped beside a stable core, or a sibling swapped (`info-session` for `debate`, `training` for `lecture`): no case
changed its verdict on a required topic. A single-run difference of fewer than ~5 cases is noise; revisions A to C
are indistinguishable from one another on that account, and only D separates from the baseline on its own.

**Remaining failures** under E: the untranslated Italian audience phrase (both runs), one German twin stating no
audience where its English twin states `public` (one run), one open discussion stating no subject (one run), and one
`format/talks` for an anniversary celebration (one run).

**Groups**: the six twin pairs classify alike on their stable core; the Turku staff/student sessions, whose texts
differ by one sentence, were told apart on audience in every run.

**Superseded assessment**: an earlier reading of 46 Pavia events in the store, under the previous prompt, listed
contradictory audience sets, sibling formats on one event, subject tags contradicted by the event, mixed granularity
and an unbounded tag count (2 to 9 per event). Mixed granularity and the occasional sibling format reproduced on the
baseline and are addressed by revisions A, D and E; the others did not reproduce on this sample.

# Model Comparison

Measured on revision D over the full sample (table above). `gemini-3.8-flash` matches `gemini-3.6-flash` within the
noise floor at the same list price ($0.75 / $3.75 per 1M tokens) and twice the wall clock, so it buys nothing here;
it stays the fallback should 3.6 be retired. `gemini-3.5-flash-lite` ($0.30 / $2.50) is rejected again: it browsed
identifiers it had composed (`subject/science`, `subject/stem`, `format/talks/workshop`) rather than read, and one
generation never settled, which aborts the feed. `gemini-3.1-flash-lite` was not tried: the lite failure mode is the
tier's, not the version's. An earlier six-event comparison under the two-vocabulary prompt reached the same ranking.

# Test Sample

`classify.json`, beside this log, holds the sample a local run of the prompt is read against: 77 extracted events
harvested on 2026-10-26 from the first index page of eight sources (Iași was unreachable), passed through
`extract()` and annotated by hand. Each case states:

- `id`, `university`, `source`, `language`: where the event comes from; `group` ties the same event published twice
  (German and English calendar entries, a staff and a student session with near-identical text), whose topics must
  agree. The Jena sources were recovered after the harvest, which had recorded the page base URL for all of them, by
  matching each case to the pages the two calendars list; two cases share a source the two calendars both list
- `input`: the `title` and `description` exactly as `classify()` hands them to the model, untranslated passages and
  page furniture included where the extractor left them
- `expected`: one verdict per branch (`subject`, `format`, `audience`), each stating:
  - `required`: topics the text plainly supports, each a topic or a list of alternatives of which at least one must
    be stated; a run missing one fails the branch
  - `allowed`: defensible extras, neither required nor penalised
  - `forbidden`: the traps the case exists for; a run stating one fails the branch
- `notes`: why the expectation is what it is

Topics are stated relative to the taxonomy (`format/talks/lecture`). Within a branch, a topic neither required nor
allowed is unexpected and fails the branch, so a branch with empty `required` and `allowed` must be left unstated. The
three branches are weighed alike: 75 cases require a subject, 75 a format and 41 an audience, while 31 cases require
the audience branch to stay empty and 5 leave it open where the text supports an audience without naming one. A
quarter of the cases carry a vocabulary trap (`conferenze`, `Literature Seminar`, `Crochet Social`, `Hacktoberfest`,
`auditions`), and two are near-empty by design (`salamanca-rural-renaissance`, `umea-emg-seminar`). Pavia, Jena,
Coimbra and Umeå are well represented; Poitiers and Salamanca carry one case each, as their sources listed little or
failed to render.

# Test Cases

## Abstention Where The Text States No Audience

A page describing a permanent museum exhibition, with no word about who it is for, MUST come back with no topic of the
audience branch, while still carrying its subject and format topics. The nearest-neighbour classifier answered
`visiting-teaching-staff` for exactly this page, on a margin of 0.0096 over the runner-up.

**CRITICAL**: an audience the text does not support is the defect this prompt exists to fix. Never relax the
abstention requirement to raise coverage. Collapsing the three branches into one `keywords` array makes a partial
answer look complete: a payload carrying subject and format topics alone is the expected shape for such a page, not a
truncated one.

## Identifiers Copied From Tool Responses

Every identifier stated MUST appear verbatim in a tool response of the same generation. Composed, completed or
recalled identifiers are dropped by the task, which logs `unknown topic <...>`: a warning in the run log is evidence
of this failure, not of a vocabulary gap.

## One Search Per Branch At Least

A generation stating topics without having called `searchTopics` for each of subject, format and audience has answered
from memory of the vocabulary rather than from the vocabulary. Read the call log alongside the payload when
validating: three searches phrased for three different aspects, not one search whose shortlist is mined for all three.

## Distances Are Not Verdicts

Where a search returns candidates standing at much the same distance, the expected behaviour is a second search with
different wording, then abstention. A generation that states the first candidate of a flat shortlist has read the
ranking as a decision, which the requirements forbid.

## Topical Wording Does Not Settle Audience

The audience query MUST be phrased for who the event addresses, not for what it covers. A generation reusing the
topical query across branches reproduces the failure of the classifier this prompt replaced.

## Branch Top Concepts Are Never Answers

`subject`, `format` and `audience` divide the scheme; they say nothing about an event on their own. A generation
stating one of them has answered that a branch applies without saying how, which the requirements forbid: browse for
the narrower concept, or state nothing for that branch. The task drops a top concept it is handed all the same.

## Most Specific Topic Of A Chain

**Input**: a drawing exhibition; a Bachelor's and Master's students' consultation hour; a lecture series on quantum
mechanics.
**Expected Behavior**: `subject/arts/visual-arts`, never `subject/arts` beside or instead of it; `audience/students`
or both leaves, since the event spans them alike; `format/talks/lecture`, never `format/talks` alone.
**Root Cause**: the baseline guideline told the model to "browse to the topic they stand under" where several leaves
fit poorly, and the model read it as licence: `subject/arts`, `format/talks`, `subject/campus`,
`subject/natural-sciences`, `subject/life-sciences` and `subject/engineering` each appeared on the sample, and a
filter on the leaf missed those events.
**Validation**: the requirement now rests on the prompt (state the most specific topic that applies; a mid-level topic
only where the event spans two or more of its children alike) and on the task, which prunes every stated topic that
stands above another stated topic and every top concept. The prompt carries the behaviour where a parent is stated
alone; the task only cuts chains.

**CRITICAL**: never reinstate a guideline that offers a broader topic as the way out of a hard choice between leaves.
The way out is to state nothing for that branch.

## Audience Evidence Is An Invitation, Not A Price

**Input**: a concert cycle with "free admission, subject to venue capacity"; an exhibition in a building that "opens
to the public for the first time"; a street installation drawing "visitors, tourists and residents"; a career talk
whose "attendance is free of charge and open to anyone interested".
**Expected Behavior**: no audience topic on the first three; `audience/public` on the fourth, which names who may
come.
**Root Cause**: `audience/public` was read off fee lines, opening hours and venue descriptions in 4 of the 31
no-audience cases of the baseline.
**Validation**: the guideline now lists what counts as an invitation and what does not, and asks the model to locate
the inviting phrase before stating an audience topic. Revision B removed every such reading; the examples added in
revision C changed nothing measurable.

**CRITICAL**: the inviting phrase may be a line of German page metadata (`Öffentlich: ja`) or an untranslated Italian
sentence. Never narrow the evidence to English prose.

## One Subject Per Facet

**Input**: a history seminar hosted by the Department of Historical, Philosophical and Religious Studies; a plant
science conference; a physics-and-mathematics exhibition.
**Expected Behavior**: `subject/humanities/history` alone; `agriculture` and `biology` without `biotechnology`;
`physics` and `mathematics` without `earth-space`.
**Root Cause**: adjacent disciplines were added beside the right one, from department names, partners and passing
mentions: 34 of 77 baseline cases carried more than one subject, and the second subject was where every unexpected
subject sat.
**Validation**: the guideline now names what is not a subject (the organiser's department, the venue, a partner, the
materials, a discipline touched in passing). Revision D halved the multi-subject cases and left no unexpected subject.

## A Format For Every Event

**Input**: an "innovation forum", a "staff week", a "Buildathon", a "hack day".
**Expected Behavior**: a format topic found by what people do there (`debate`, `networking`, `workshop`,
`competition`), never an empty format branch because the word is unusual.
**Root Cause**: 3 baseline cases carried no format where any of several alternatives would do.
**Validation**: the guideline tells the model to search by activity rather than by the word; revision D left one
format missing in one of two runs.

## Format Is Read Independently Of Subject

A conference on climate policy carries both a format topic and a subject topic; a conference on nothing in particular
carries a format topic alone. A generation that lets the subject decide the format, or declines to state a format
because the subject is unclear, has collapsed two independent branches.
