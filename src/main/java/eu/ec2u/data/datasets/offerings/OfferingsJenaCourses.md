---
title: Offerings › Jena › Courses
summary: Integration status for Jena courses
description: Integration status for the Jena university courses offerings from the Friedolin module catalogue.
status: planned
---

Authoritative integration status for the Jena courses. Not yet integrated; tracked as gh-53.

## Friedolin module catalogue

Source for Jena course modules: the **complete** Friedolin module catalogue (all degree types), exposed through the
Friedolin portal (HISinOne/QIS `qisserver/rds`). The catalogue is a server-rendered tree, reachable anonymously: every
request is a plain `GET` with no cookies and an empty `asi=` session parameter. The guest-studies (*Gasthörer*) branch
(`abschl=96`) is one degree type within it; courses reached through it are tagged as continuing-education on output (see
[Audience tagging](#audience-tagging)), keeping that subset identifiable in the UI audience facet.

Friedolin is Jena's branded instance of a campus-management system from HIS eG (Hochschul-Informations-System,
Hannover), the standard vendor across most German universities. The `qisserver/rds` URLs and the
`state=…&nodeID=…&expand=…` tree belong to the older **QIS/LSF** generation (LSF = *Lehre, Studium, Forschung*, the
course-catalogue module); **HISinOne** is the newer unified successor platform. Because it is a stock HIS product, the
same tree structure and module-description endpoints recur at other German EC2U universities running QIS, so this
parsing approach should largely transfer.

The `nodeID` is a `|`-joined path; **`expand=0` renders a node's children** (`expand=1` returns an empty list). The tree
nests five levels; the harvester walks every degree type under the root (the guest-studies branch is `abschl=96`). PO =
*Prüfungsordnung*, a programme's examination regulations; `pversion` is its version year (e.g. `2020`).

| Level         | `nodeID` segment added | Yields                                                  |
|---------------|------------------------|---------------------------------------------------------|
| root          | `auswahlBaum`          | 15 degree types (`abschluss:abschl=NN`); walk all       |
| 0 degree type | `abschluss:abschl=NN`  | degree programmes (`studiengang:stg=NNN`); `96` = guest |
| 1 program     | `studiengang:stg=004`  | PO-version variants (`stgSpecials:…,kzfa=H,pversion=…`) |
| 2 PO-version  | `stgSpecials:…`        | modules (`konto:pordnr=NNNNN`)                          |
| 3 module      | `konto:pordnr=27380`   | exam (`pruefung`) and course units (`unit`)             |

The 15 Abschluss nodes are the degree types (Bachelor, Master, Staatsexamen, Lehramt, …, and `96` Gaststudium); the
harvester scans them all. Under any of them many studiengänge are empty ("Keine Auswahl vorhanden"): every programme
exists in Friedolin, but module descriptions show only where the module catalogue has already been published (per the
rollout state). The same module recurs under several degree types (deduped by module number); membership of the
`abschl=96` branch is what drives the continuing-education tag.

Each module row carries three controls; the **(i) info button** is the data target:

- **(i)** description panel: `…&next=redTree.vm&createInfoTree=Y&create=blobs&nodeID=…konto:pordnr=NNNNN&expand=1…`
- **+** inline expand of the exam/unit hierarchy: `…&next=subtree.vm&expandAll=Y…`
- **PDF** Modulhandbuch: `…&next=wait.vm&createPDF=Y&create=blobs…`

The info panel returns a flat field table mapping onto course fields: module name and number (`[305510]`), module code
(`AG 711`), ECTS (`10 LP`), workload (Präsenz / Selbststudium / sum), duration, Modulturnus, Modulverantwortlicher,
Inhalte, Lern- und Qualifikationsziele, Lehrformen (`VL 2 SWS, Ü 2 SWS`), Unterrichtssprache, Voraussetzungen,
Literatur, and Art des Moduls.

Harvest: from the root, walk every `abschl` then levels 0→2 with `expand=0` to enumerate `konto:pordnr` module ids,
taking only each programme's current PO (ignore phasing-out *auslaufend* versions), then fetch each module's
`createInfoTree=Y` panel. A module is reused across several programmes (distinct `pordnr` nodes, same module), so dedupe
by the `[305510]`-style module number. There is no canonical per-module URL, only
placement-specific panel URLs, so deduped courses carry no `schema:url` (the panel is fetched only to read its fields).
The English variant is reachable with `&language=en`.

| Source                                                                       | Description           |
|------------------------------------------------------------------------------|-----------------------|
| [friedolin.uni-jena.de/qisserver/rds?state=modulBeschrGast…][friedolin-root] | module catalogue [de] |

[friedolin-root]: https://friedolin.uni-jena.de/qisserver/rds?state=modulBeschrGast&moduleParameter=modDescr&struct=auswahlBaum&navigation=Y&next=tree.vm&nextdir=qispos/modulBeschr/gast&nodeID=auswahlBaum&expand=0&lastState=modulBeschrGast&asi=

## Target mapping

This harvester produces one entity: an `ec2u:Course` per Modul (`konto:pordnr`). Programmes are not harvested here; they
come from the Jena programme catalogue (see [Offerings › Jena](OfferingsJenaPrograms.md)) and are attached through
`schema:hasCourse` ([Linking to programmes](#linking-to-programmes) below). `ec2u:Course` is typed as both
`schema:Course` and `schema:CourseInstance`, so course- and instance-level fields collapse into one entity; the
`pruefung` (exam) and `unit` (VL/Ü Veranstaltungseinheiten) sub-nodes have no model home and are dropped. Inhalte feeds
`schema:description` and Lern- und Qualifikationsziele feeds `schema:teaches`; `rdfs:comment` is a shortened (≤500-char)
form of `schema:description`, not a verbatim source field. Such prose is uneven across modules; everything else is
structured values or `--`.

Housekeeping fields (`ec2u:dataset`, `ec2u:university`, `ec2u:generated`, `ec2u:version`) and `rdfs:isDefinedBy` are set
by the harvester, not sourced from the panel, and are omitted from the tables below.

The `From` column marks the entity each property is inherited from:

- `Ref` – `Reference`
- `Thing` – `schema:Thing`
- `LR` – `schema:LearningResource`
- `Course` – `schema:Course`
- `Inst` – `schema:CourseInstance`
- `EOP` – `schema:EducationalOccupationalProgram`
- `EC2U` – the dataset-specific subset

### ec2u:Course ← Modul (`konto:pordnr`)

`ec2u:Course` = `Reference` + `schema:Course` + `schema:CourseInstance`; `schema:Course` extends
`schema:LearningResource`, and both schema types descend from `schema:Thing`.

| EC2U term                              | From   | Friedolin field                        | Notes                                                                           |
|----------------------------------------|--------|----------------------------------------|---------------------------------------------------------------------------------|
| `id`                                   | Ref    | module number (`[305510]`)             | EC2U IRI minted from the module number                                          |
| `rdfs:label`                           | Ref    | Name des Moduls                        | strip the leading `[number]`                                                    |
| `rdfs:comment`                         | Ref    | (shortened `schema:description`)       | **shortened** to ≤500 chars                                                     |
| `schema:url`                           | Thing  | —                                      | empty — no canonical per-module URL (placement-specific only)                   |
| `schema:identifier`                    | Thing  | module number (`[305510]`)             | the source module number, verbatim                                             |
| `schema:name`                          | Thing  | Name des Moduls                        | same value as `rdfs:label`                                                      |
| `schema:description`                   | Thing  | Inhalte                                | content; `rdfs:comment` shortens it                                             |
| `schema:disambiguatingDescription`     | Thing  | —                                      | gap                                                                             |
| `schema:image`                         | Thing  | —                                      | gap                                                                             |
| `schema:about`                         | Thing  | —                                      | `review()` AI classification (ISCED-F)                                          |
| `schema:numberOfCredits`               | LR     | ECTS Punkte (`10 LP`)                  | strip ` LP` → decimal                                                           |
| `schema:teaches`                       | LR     | Lern- und Qualifikationsziele          | learning outcomes                                                               |
| `schema:assesses`                      | LR     | Voraussetzungen f. Vergabe der LP      | assessment                                                                      |
| `schema:competencyRequired`            | LR     | Vorkenntnisse                          | prior knowledge                                                                 |
| `schema:educationalCredentialAwarded`  | LR     | —                                      | gap — credential is programme-level                                             |
| `schema:occupationalCredentialAwarded` | LR     | —                                      | gap                                                                             |
| `schema:educationalLevel`              | LR     | —                                      | excluded — no robust source (not in panel; review() skips it)                   |
| `schema:provider`                      | LR     | —                                      | excluded — Modulverantwortlicher is a person/role, not an org                   |
| `schema:courseCode`                    | Course | Modulcode (`AG 711`)                   |                                                                                 |
| `schema:inLanguage`                    | Course | Unterrichtssprache                     | default `de` when `--`                                                          |
| `schema:timeRequired`                  | Course | Dauer des Moduls (`1 Semester`)        | → duration                                                                      |
| `schema:coursePrerequisites`           | Course | Voraussetzungen z. Zulassung zum Modul | formal admission prerequisites                                                  |
| `schema:courseWorkload`                | Inst   | Arbeitsaufwand Summe (`300 Stunden`)   | → `PT300H`                                                                      |
| `schema:courseMode`                    | Inst   | —                                      | gap — Lehrformen is composition only                                            |
| `schema:isAccessibleForFree`           | Inst   | —                                      | gap — fee status not in source                                                  |
| `schema:audience`                      | Inst   | `abschl=96` membership                 | continuing-education tag for guest subset; else unset                           |
| `‹inProgram›`                          | EC2U   | tree path `(abschl, stg, …)`           | course-owned reverse of `schema:hasCourse` (program read-only); many per course |

Unmapped source fields (no model home): Modulverantwortlicher, Modulturnus, Art des Moduls, Lehrformen (`VL/Ü`, SWS),
Literatur, Zusätzliche Informationen.

### Audience tagging

The harvest spans the whole catalogue, so the guest-studies subset must stay identifiable. Every module reached through
the `abschl=96` (Gaststudium) branch is tagged `schema:audience` =
`/taxonomies/stakeholders/teaching/students/continuing-education`, the term that drives the UI audience facet (the same
tag the manually-curated `OfferingsLLL` courses carry). Modules reached only through regular degree types are left
untagged. As a module is deduped by its `[305510]` number, the tag applies when **any** of its placements sits under
`abschl=96`. Reuse the existing `LLL` topic constant rather than a new one: `OfferingsLLL` already sets
`.audience(set(LLL))` (plus `.seeAlso(set(LLL.id()))` to mark the set); apply the same on the `abschl=96` subset.

### Linking to programmes

The link is **owned by the course**: it is stored on `Course.inProgram` (the `@Reverse("schema:hasCourse")` edge,
many-to-many). `Program.hasCourse` is only a reverse view the API exposes, not a stored field, so linking writes
**courses only** and never mutates programmes. Follow the existing `OfferingsPavia` / `OfferingsLinz` pattern: reference
the programme by id minted from a shared code, with no store lookup —
`.inProgram(set(new ProgramFrame(true).id(PROGRAMS.id().resolve(uuid(JENA, <code>)))))`.

The shared code is the Friedolin programme variant `(abschl, stg, kzfa, pversion)`, which **both sides already hold**:
the course harvest reads it from each module's tree placement, and the programme pages expose it in their
module-catalogue PDF link `…/modulkataloge/de/<abschl>_<stg>_…pdf` (e.g. `68_272`, `82_679`). For the id reference to
resolve, the Jena
`ec2u:Program` id must be **minted from that code** rather than the page URL (it is currently `uuid(JENA, url)`); this
is the same language-neutral-id change flagged for the [German-catalogue switch](OfferingsJenaPrograms.md). A guest-studies
(`abschl=96`) module then links to the regular-degree programme(s) sharing its `stg`; dedupe shared modules with
`.filter(distinct(CourseFrame::id))`. Where no programme matches (PDF not published, or `stg` absent from the catalogue)
the course is left unlinked. If the codes cannot be aligned at harvest time, fall back to the `OfferingsSalamanca`
post-load pattern: load courses and programmes separately, then cross-reference by code in a `store.mutate()` step.

## Plan

Implementation outline for the `OfferingsJenaCourses` harvester (gh-53), feeding the Courses dataset. Phase 1 ships
standalone courses (deduped, audience-tagged, no `inProgram`); phase 2 adds the programme links once Program ids are
keyed by the shared code.

1. **Enumerate modules.** From the root, walk **every** `abschl` → `studiengang` → `stgSpecials` with `expand=0`, taking
   only each programme's current PO (ignore phasing-out *auslaufend* versions); skip empty studiengänge. Collect
   `konto:pordnr` module ids and dedupe to one course per `[305510]` module number, recording each placement's
   `(abschl, stg, kzfa, pversion)` and whether any sits under `abschl=96`.
2. **Fetch each panel.** GET the `createInfoTree=Y` URL per `pordnr` and parse the field table into an `ec2u:Course`
   per the mapping above.
3. **Localise, classify, tag.** Run `Course.review()` (translate DE→EN, AI-classify `schema:about` ISCED-F); tag
   `audience` with the `LLL` continuing-education topic for the `abschl=96` subset (as `OfferingsLLL` does); default
   `inLanguage` to `de`.
4. **Link to programmes (phase 2).** Set `.inProgram(...)` on the course by id reference to the programme(s) minted from
   the shared `(abschl, stg, …)` code; dedupe with `.filter(distinct(CourseFrame::id))`. Requires Program ids keyed by
   that code; otherwise fall back to the `OfferingsSalamanca` `store.mutate()` cross-reference.
5. **Persist.** `store.modify` the courses for `university = JENA`, mirroring `OfferingsJenaPrograms`.

## Known limitations

- **No temporal coverage.** A module maps to a single timeless `ec2u:Course`; semesters and successive PO versions are
  not modelled. The course `id` is stable across versions, keyed on the `[305510]` module number; `ec2u:version` is left
  as the harvester sets it.
- **Legacy POs ignored.** Only each programme's current PO is harvested. A PO revision largely renumbers modules (e.g.
  Angewandte Informatik 2008→2014 shares ~4 of ~200 codes), so dedup collapses concurrent placements, not historical
  versions.

- **planned** – initial integration (gh-53)
