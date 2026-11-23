---
name: hub-tester
tools: Read, Write, Edit, Bash
description: "Cross-browser tester for the EC2U Knowledge Hub: the pages and catalogues to cover, the facet and range parity scripts, the local dark pass, the store queries that find content defects, and where each kind of fix lives. MUST be used WITH browser-tester when testing edge.data.ec2u.cc or any hub deployment across browsers, checking visual or functional parity, or rating the effort of a hub defect."
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

# Test Plan

Run the plans of `browser-tester` on the six targets against `edge.data.ec2u.cc`, then the local passes below, which
reach what BrowserStack sessions cannot: the dark scheme and phone width. Record every finding with
`browser-tester:record`, in a record of the run kept apart from this skill.

| Pass       | Where                         | Pages                          | Widths              |
|------------|-------------------------------|--------------------------------|---------------------|
| BrowserStack plans | six targets, `edge.data.ec2u.cc` | [Pages](#pages)         | session windows     |
| Local dark | local Chrome, dev server      | [Pages](#pages), RCC Norr      | desktop and 390px   |
| Local light phone | local Chrome, dev server | [Pages](#pages), RCC Norr   | 390px               |

A finding seen only in the dark pass is a dark defect; one seen at 390px in both schemes is a layout defect.

# Local Passes

The local passes use Claude in Chrome on the user's own Chrome and a client dev server, so they need the extension
connected; they cover Chrome only, and leave Firefox, Safari and Edge in the dark scheme as not covered.

1. **Serve**: reuse the data server already on `localhost:8080` if one answers, else start it with `npm run start`;
   start the client alone from `packages/client` with `npx vite`, bound to `localhost` (never `--host`), and read the
   port it prints, as `5173` may already be taken by the user's own server
2. **Pin the scheme** (dark pass only): add `data-scheme="dark"` to `<html>` in `packages/client/src/index.html`; Skin
   then renders every page in the dark scheme, whatever the system setting. This is the only sanctioned way to force
   the scheme: never through the address, whose query string holds catalogue state and breaks on a stray parameter,
   and never through a script run in the page
3. **Desktop width**: open each page in a fresh tab and take a screenshot once the list or content has settled
4. **Phone width**: the browser window cannot shrink below ~1230px, so write a host page into a tab holding three
   390x780 `<iframe>` frames on same-origin addresses, and set the `src` of each frame in turn to cover every page,
   three at a time; an edit to `index.html` reloads the host page and drops the frames, so write them again after it
5. **Restore**: remove `data-scheme="dark"` from `index.html`, stop the client dev server the pass started, close the
   tabs it opened, and confirm with `git status` that no source file remains modified
6. **Clear leftovers**: session storage on `localhost` survives between runs and may restore an address from an
   earlier session; clear it before the first page if a page opens on an unexpected address

Anything styled by `prefers-color-scheme` rather than by Skin tokens ignores the pin, as the home page funding logo
does: record it as a defect, since a theme switch would pin the scheme the same way.

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
| Facet value cap (`TallyOptions`)       | `packages/client/src/index.core.ts`                                   |
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

Before delivering, verify that:

- `browser-tester` ran alongside this skill on its six targets, and every catalogue was covered
- both local passes ran on every page at both widths, or the record lists what they missed as not covered
- the scheme pin is reverted, the dev server stopped and the tabs closed, with `git status` showing no source change
- content symptoms were checked in the store, and each defect's effort names where its fix lives
