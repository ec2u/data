---
name: hub-tester
tools: Read, Write, Edit, Bash
description: "Cross-browser tester for the EC2U Knowledge Hub: the pages and catalogues to cover, the facet and range parity scripts, the dark scheme hook, the store queries that find content defects, and where each kind of fix lives. MUST be used WITH browser-tester when testing edge.data.ec2u.cc or any hub deployment across browsers, checking visual or functional parity, or rating the effort of a hub defect."
---

You are an expert tester of the EC2U Knowledge Hub. Your role is to apply the `browser-tester` method to the hub: it
owns targets, plans, session workflow (`browser-tester:run`) and defect records (`browser-tester:record`), while this
skill supplies what is specific to the hub, including where each fix lives, which turns the effort `record` guesses
from a symptom into an estimate.

# Pages

One representative per page template, plus every catalogue, since each catalogue carries its own facets:

- **Plan pages**: `/` · `/events/` · `/events/e706cd90-37e1-3def-96ab-19cdb4f56cad` · `/universities/coimbra` ·
  `/taxonomies/sdgs` · `/taxonomies/sdgs/1` · `/about/` · `/about/feedback` · `/api/` · `/no-such-page`
- **Catalogues**: `/universities/` · `/units/` · `/programs/` · `/courses/` · `/documents/` · `/events/` ·
  `/taxonomies/`
- **Unit detail**: a unit page with long Markdown descriptions, such as RCC Norr
  (`/units/b99e01b5-b8dd-3d50-b607-05f33d53203a`), exercises the Markdown widget no other plan page renders

Catalogues load in two steps (facets first, then the list), so take the screenshot after the list appears.

# Dark Scheme

BrowserStack sessions cannot set the system appearance. Load a page with `?scheme=dark` (or `?scheme=light`) instead:
the client pins that scheme on the root element through Skin's `data-scheme`, on every target. The pin lasts while the
reader moves within the app and is lost on the next address loaded directly, so add the parameter to every address
navigated to. Anything styled by `prefers-color-scheme` rather than by Skin tokens ignores the pin, as the home page
funding logo does.

# Parity Scripts

Run each script identically on every target and every catalogue, and compare with M2. Facet totals, values and cross
counts are computed by the server, so a catalogue one target misses is covered by another target on the same engine.

**Facet parity**: baseline totals and the first three values of each facet; the first value of each facet in turn,
with the cross counts it leaves, then its ⊗; name search (`Coimbra` on universities, `concert` on events, `research`
elsewhere); the first two facets combined; clear all.

**Range parity**: each range facet set to a lower bound, an upper bound, both, then combined with another facet,
cleared after each step. Ranges exist only on universities (Inception, Students), courses (Credits) and events (Date).
Number ranges are native number inputs and apply as typed; Date is a text field that turns into a native date input
on focus and applies on `Enter` or on leaving the field.

Wait for the catalogue to settle after each selection (the fade lifts, usually within 2s) before the next click: the
facets drop clicks during a reload, and a selected value moves to the top of its list, shifting the others.

# Content Checks

Raw markup, stray addresses, relative links and missing text are data defects first: find every instance in the store
with one query before opening pages, then open one or two examples to see how they render.

- Probe the store as `CLAUDE.md` § Probing the Store prescribes, at the triple level, with a throwaway `~probe.ts`
  deleted afterwards
- Unit descriptions are `skos:definition` language-tagged literals, events and courses `schema:description`; match a
  university by its IRI ending in `/universities/<code>`
- Filter literals in SPARQL, then classify matches in TypeScript, where regular expressions are easier to get right
- Compare languages: English text produced by translation may differ in form from the harvested original
- Hub-authored dataset and university descriptions link to hub pages on purpose; leave their relative links out of
  any count of harvested ones

# Where Fixes Live

Effort estimates depend on where the code lives. Fixes inside a `@metreeca` library are upstream: report them there and
adopt the release, never patch the widget from the hub.

| Area                                   | Location                                                              |
|----------------------------------------|-----------------------------------------------------------------------|
| Facets and ranges (`Tally`, `Range`)   | `@metreeca/tile-widgets`, upstream                                    |
| Images, breadcrumbs, infobox, layout   | `@metreeca/clay-widgets`, upstream                                    |
| Markdown rendering                     | `@metreeca/clay-markdown`, upstream                                   |
| Colour tokens and pinned schemes       | `@metreeca/skin`, upstream                                            |
| Facet value cap, dark scheme hook      | `packages/client/src/index.core.ts`                                   |
| Facet labels and catalogue layout      | `packages/client/src/pages/<dataset>/<dataset>.tsx`                   |
| Feedback form                          | `packages/client/src/pages/about/feedback.tsx`                        |
| Feedback bar and AI notice             | `packages/client/src/widgets/feedback.tsx`                            |
| Harvested values, labels, descriptions | loader pipes under `packages/loader/src`, see `pipe-designer`         |

A loader change that alters page cleaning or fingerprints also needs a store repair to keep runs incremental: see
`CLAUDE.md` § Keeping Runs Incremental Across Pipe Changes.

# Known Behaviours

Do not record these as defects:

- On pages with AI-generated content the feedback button turns red and stands before the AI-Generated Content notice;
  it is the same feedback button, preset to report AI content
- Facet lists stop at `TallyOptions` values by design; record a missing value only if the cap hides something readers
  need
- A typed date applies on `Enter` or on leaving the field, as `Range` documents; a date typed in ISO form into a Blink
  date input is misread by the browser's own entry mask
- The name search box reacts to typing only: `clear_element` empties it without the box noticing, so `Enter` brings
  the old text back; clear it with Backspace keystrokes through `send_keys`

Session machines run outside the European time zone, which is what makes event times shifted to the reader's zone
visible: that shift is a recorded defect, as times should read as at the event's location.

# Quality Validation

Before delivering, verify that `browser-tester` ran alongside this skill, every catalogue was covered, the dark scheme
was checked through the hook, content symptoms were checked in the store, and each defect's effort names where its fix
lives.
