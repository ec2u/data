# EC2U Data Site Mockup: Requirements

Nov 5, 2026 · @Alessandro Bollini

Companion to [EC2U Data Site Mockup: References](https://claude.ai/artifact/3HcnVDNtQbj8dy2898KK1G) and the functionality survey.

## Context

The current Knowledge Hub was meant to be simple and no-frills, but it reads as drab. Its two main limits are the lack of colour and the fixed side-panel layout: the panel is simple and consistent, but rigid, and it makes it hard to fit individual pages to their actual needs.

## Inspiration: Stephen Few

The requirements follow Stephen Few's principles for presenting information: show the data, mute everything else, and spend attention-grabbing attributes only where they carry meaning.

| Principle | Gist | Requirements |
| --- | --- | --- |
| Data over non-data | Maximise pixels carrying data; mute or remove borders, fills and grids | R1, R2 |
| Muted colour, bright for emphasis | Greys and soft tints for context; saturated colour only where attention is due | R5, R6, R8 |
| Preattentive attributes on purpose | Colour, size, position and weight each signal one thing, never decoration | R5, R8 |
| Context and comparison | Numbers beside something to compare with: facet counts as inline bars, totals with share of whole, sparklines for dated sets | R18 (share bars); facets and dated sets not yet covered |
| Fit the format to the task | Tables for lookup, bars over pies, small multiples over cramming | Not yet covered |
| Consistency | The same encoding means the same thing everywhere | R6, R7 |

## Minimalism

Good vibes don't imply gratuitous visuals.

| ID | Requirement |
| --- | --- |
| R1 | Every visual element earns its place by conveying information, identity or a path forward; nothing is purely decorative. |
| R2 | Hierarchy comes from type scale, spacing and colour before borders, boxes and shadows. |
| R3 | Imagery appears only where the data supplies it (e.g. events, universities); no stock or filler images. |
| R4 | Motion is limited to state feedback, uses skin durations and easings, and drops to zero under reduced motion. |

## Meaning

Colour and structure must convey information, not distract.

| ID | Requirement |
| --- | --- |
| R5 | Each colour role has one consistent meaning: strong for primary actions and current state, subtle for context and secondary content, status colours only for status. |
| R6 | Each dataset has an identity colour from the chart series, applied as small markers rather than fills and used consistently on home tiles, listings and records. |
| R7 | The same kind of content always sits in the same place across pages (filters, properties, related records, help). |
| R8 | Visual weight follows importance: one dominant element per page (search on home, results on listings, title on records), with at most one strong accent per region. |

## Design system

| ID | Requirement |
| --- | --- |
| R9 | All styling uses [metreeca/skin](https://github.com/metreeca/skin) tokens and mechanisms; `ec2u-skin.css` supplies the colour anchors. |
| R10 | Changes to the skin are proposed as additions or overrides and flagged as such; no parallel styling. |
| R11 | Status colours stay at skin defaults; meaning is never carried by colour alone. |

## Colour

| ID | Requirement |
| --- | --- |
| R12 | Brand colour appears as surfaces (header, hero, highlights), not only as link text. |
| R13 | Primary controls and dataset titles use `look="strong"`; secondary areas use the `-subtle-*` tints. |
| R14 | Light and dark schemes are both supported through `light-dark()` pairs. |

## Layout

| ID | Requirement |
| --- | --- |
| R15 | A shared top bar and footer, paired with ec2u.eu, give consistency across pages. |
| R16 | Pages compose their own regions; the side rail is optional, not fixed. |
| R17 | Listings keep the filter rail, which collapses to a drawer below `--skin--viewport-medium`. |
| R18 | Home has no rail and borrows the structure of the UNIFIND home page: a headline naming the purpose (“Discover EC2U data”), one search box scoped by a dataset selector (All plus the six datasets), and a row of six dataset tiles with exact counts linking to their listings; nothing else above the fold. Execution: a subtle brand band instead of a photo; tiles as quiet raised surfaces with a dataset colour marker and a share-of-total bar; strong colour reserved for the search action. |
| R19 | Record pages use a header plus two columns: properties and related records. |

## Contextual help

The hub has extensive documentation and reference material (taxonomies, vocabularies, data models), but it is hard to find. The new version adds dynamically generated, model-driven API and data model specs.

| ID | Requirement |
| --- | --- |
| R20 | Every page (home, listings, records) has a help entry point in the same place; no page is left without one. |
| R21 | Help is layered: inline hints next to the element, then the page's info view (`;info`), then the full reference (data model, API, taxonomies). |
| R22 | Facet and property labels show their model description on demand and link to the matching data model entry. |
| R23 | Values drawn from a taxonomy (e.g. topics, subjects, levels) link to the taxonomy, which is browsable and shows each term's definition. |
| R24 | Each dataset's info view links to its generated data model and API specs; the specs link back to the dataset. |
| R25 | Help text is generated from the models wherever possible, so it stays in sync with the data; no hand-written duplicates. |
| R26 | Help is visually quiet (`look="subtle"`) and never displaces the content it explains. |

## Retained functionality

| ID | Requirement |
| --- | --- |
| R27 | Filter state stays in the URL, facets keep their counts, and the `ⓘ` info views and AI-generated content notice are kept. |
