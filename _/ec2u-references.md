# EC2U Data Site Mockup: References

Nov 5, 2026 · @Alessandro Bollini

## Purpose

A mockup for the EC2U data website: functionality taken from the existing Knowledge Hub, branding paired with the main EC2U site, built on the Metreeca skin design system, with a search-first home page inspired by UNIFIND.

## Functional reference: data.ec2u.eu

[data.ec2u.eu](https://data.ec2u.eu/) serves a JSON-LD catalogue ("EC2U Dataset Catalog") with six member datasets. Each carries title, short label, description, issue date, publisher (ec2u.eu), rights (© 2022‑2025 EC2U Alliance) and a [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/) licence. Root fetch returned data, not the rendered UI.

| Dataset | Path | Content | Issued |
| --- | --- | --- | --- |
| Courses | `/courses/` | Degree, vocational and personal development courses | 2022-03-10 |
| Documents | `/documents/` | Regulations, policies and governance documents | 2023-07-15 |
| Events | `/events/` | Events at partner universities and local organisations | 2022-01-01 |
| Programs | `/programs/` | Formal degree and vocational qualification programmes | 2022-03-10 |
| Units | `/units/` | Research units and supporting structures | 2022-01-01 |
| Universities | `/universities/` | Background, history and statistics on partners | 2022-01-01 |

Each dataset is described at `/datasets/<name>`.

**Local dev reference:** `http://localhost:5173/` runs the next version of data.ec2u.eu (Vite dev server). Treat it as the primary functional reference where it differs from the live site; it is reachable only on your machine, so share screenshots or notes for details.

## Main site to pair with: ec2u.eu

[ec2u.eu](https://ec2u.eu/) presents an alliance of 9 universities and 60+ local partners. The data site should feel like a section of it.

| Element | Main site | Bridge to data site |
| --- | --- | --- |
| Navigation | Get involved (Students, Researchers, Staff, Citizens), About, Events & News, Contact, Search | Reuse labels; add a link back |
| Hero | Full-bleed video, eyebrow + large title + subtitle | Lighter hero around search |
| Audience cards | Per-persona entry points | Persona shortcuts into datasets |
| Feature band | Joint Master Programmes callout | Programmes and Courses datasets |
| Gallery | 9 partner universities with photos | Universities dataset |
| Footer | Socials, newsletter, Poitiers address, EU co-funding notice | Mirror footer and notice |

Partners: Poitiers, Salamanca, Coimbra, Pavia, Iasi, JKU Linz, Turku, Jena, Umeå.

## Design system: metreeca/skin

[@metreeca/skin](https://github.com/metreeca/skin) supplies tokens and a base stylesheet in a `skin` cascade layer; unlayered app rules win. The project skin `ec2u-skin.css` restates the four colour anchors to match ec2u.eu:

```css
:root {
    --skin--color: light-dark(#000, #EEE);
    --skin--background-color: light-dark(#FFF, #0E0F12);
    --skin--color-subtle: light-dark(#1B2C51, #A4B8DF);
    --skin--color-strong: light-dark(#2E64E0, #709CF5);
}
```

| Area | Tokens / mechanism |
| --- | --- |
| Colour anchors | `--skin--color`, `-background-color`, `-color-subtle`, `-color-strong`; derived scales `-subtle-*`, `-strong-*`, `-gray-*` (010 to 100) |
| Status | `--skin--color-info`, `-pass`, `-warn`, `-fail` (+ `-stroke` for text); left at defaults |
| Type | `--skin--font-family`, `-heading`, `-mono`; Roboto, Roboto Condensed, Roboto Mono by default |
| Loudness | `look`: `subtle`, `normal`, `strong`; area default via `--skin--look` |
| Meaning | `level` (content), `mode` (controls), `status` (reports) on the info/pass/warn/fail scale |
| Surfaces | `-background-color-raised` + `-box-shadow-raised` (cards); `-overlay` pair (menus, dialogs); `-blanket` |
| Spacing | `--skin--spacing-*` and `--skin--scaling-*`, in `em` |
| Radii | `--skin--border-radius` (length), `--skin--border-radius-*` (share) |
| Breakpoints | `--skin--viewport-small/medium/large/xlarge` (30, 48, 64, 90 rem) via `@container style(...: on)` |
| Charts | `--skin--color-series-1..9`, `-area-1..4`, `-heat-*` |
| Motion | `--skin--duration-*`, `--skin--easing-*`; zero under reduced motion |
| Schemes | `light-dark()` pairs; `data-theme` pins a subtree |

A step is never told by colour alone: pair it with an icon and wording.

## Home page inspiration: UNIFIND UNIPV

[UNIFIND UNIPV](https://unipv.unifind.cineca.it) (Cineca, built on VIVO) is a search-first expertise portal for the University of Pavia.

| Pattern | UNIFIND | EC2U adaptation |
| --- | --- | --- |
| Hero | One headline ("Discover expertise in UNIPV") over a single search box | "Discover EC2U data" over search |
| Scope tabs | All, Courses, Modules, Professions, People, Publications, Structures | All + the six datasets |
| Directory mode | Toggle: titles only, alphabetical results | Same toggle |
| Count tiles | Compact totals per entity (434, 6.4k, 225, 3.3k, 138k, 25), each linking to its listing | One tile per dataset |
| Chrome | Institution logo, IT/EN switch, slim footer | EC2U logo, language switch, ec2u.eu footer |

## Implementation notes

- Load order: skin stylesheet, then `ec2u-skin.css` overrides in the document head so the first frame is branded.
- A hosted mockup cannot load external stylesheets (only scripts and Google Fonts), so the skin CSS is inlined; Roboto faces load from Google Fonts.
- Dataset counts on the home page need a source; [data.ec2u.eu](https://data.ec2u.eu/) exposes the catalogue but no totals in the root response.
- Status colours keep skin defaults so meaning stays stable against the EC2U blues.

## Sources

- [data.ec2u.eu](https://data.ec2u.eu/)
- [ec2u.eu](https://ec2u.eu/)
- [metreeca/skin](https://github.com/metreeca/skin)
- [UNIFIND UNIPV](https://unipv.unifind.cineca.it)
- Project file `ec2u-skin.css`
