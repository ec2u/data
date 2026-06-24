This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

| Reference                             | Purpose                                                                |
|---------------------------------------|------------------------------------------------------------------------|
| @docs/guidelines/modelling.md         | Standards for documenting and structuring data models                  |
| @docs/guidelines/deploying.md         | Procedures for Google App Engine deployment                            |

---

# Architecture Overview

## Hybrid Java/TypeScript Stack

This is a data-centric application with a Java backend serving both REST APIs and a React frontend. The build process
uses Maven to orchestrate both Java compilation and frontend bundling via the frontend-maven-plugin.

## Backend Architecture (Java)

- **Main entry**: `eu.ec2u.data.Data` class serves as the main server using the Metreeca Flow framework
- **Data processing**: `eu.ec2u.data.Boot` runs data ingestion pipelines for all datasets
- **Datasets**: Each dataset type (courses, events, documents, etc.) has its own package under `eu.ec2u.data.datasets`
- **RDF/Semantic Web**: Uses RDF4J for semantic data storage and SPARQL queries, connected to GraphDB

## Frontend Architecture (TypeScript/React)

- **Location**: Source in `src/main/typescript`, built assets served by Java server
- **Entry point**: `src/main/typescript/index.tsx`
- **Framework**: React with TypeScript, built using Vite
- **Styling**: CSS with PostCSS nesting plugin
- **API**: Consumes REST/JSON-LD APIs from the Java backend

## Key Dependencies

- **Backend**: Metreeca Flow framework, RDF4J, OpenAI Java client
- **Frontend**: React, @metreeca/view components, Vite
- **Database**: GraphDB (configured via environment variables)
- **Deployment**: Google App Engine

## Configuration

- **Maven properties**: Java 21, Node 22.14.0, npm 11.2.0
- **Environment**: Production detection via Google App Engine environment
- **Secrets**: GraphDB credentials, OpenAI API key, and sensitive parameters for accessing data sources stored in
  Google Cloud Secret Manager

# Data Source Integration Notes

Each data source harvester carries a standalone integration-notes Markdown file alongside it (for example,
`src/main/java/eu/ec2u/data/datasets/events/EventsTurkuUniversity.md` next to `EventsTurkuUniversity.java`). The file is
the authoritative, non-technical status record for that source and must read as a brief standalone document.

## Structure

- **Front matter** — YAML with `title`, `summary`, `description`, and `status` (`active`, or `planned` for a source not
  yet integrated). The `title` is a breadcrumb following the harvester class-name segments, `Dataset › University`
  (e.g. `Events › Turku › University`, `Events › Iași › University › 360`, `Events › Pavia › Ghislieri`). No H1 heading:
  the title lives in the front matter. Do not duplicate the university or dataset (already in the title) or a version
  date (already the newest version section) as separate keys.
- **Intro** — one short paragraph noting that the most recent version is listed first and superseded versions are kept
  below (drop the superseded clause when there is only one version).
- **One section per major version**, newest first, headed `# <YYYY-MM-DD> – <name>` where the date is the version's
  start. A new **major** version means the source was completely changed; **minor** reworks (tweaking the source set,
  adjusting the data model) and **patches** (bug fixes) stay as change-log entries within the current version. Each
  section holds, in order:
  - a one-line description of the integration approach (no `Integration` heading);
  - a sources table (no `Sources` heading), **one row per URL**, with columns:
    - `Source` — the full URL **inline** (no reference links);
    - `Description` — the source name followed by a lowercase ISO language tag in brackets, e.g.
      `General university events [de]`, `International Office [en]`;
    - `Notes` — optional, included only when a row needs an extra remark;
  - a change log: a plain bullet list (no heading), newest first, each `- **<YYYY-MM-DD>** – <change>`, ending with an
    `initial integration` entry dated to the version's start.
- Use en dashes (`–`) as the date/label separator; ISO dates and list bullets keep hyphens; no em dashes.
- Inline source URLs make some table rows exceed 120 columns; that is accepted for these reports. Run the IDE formatter
  (`mcp__idea__reformat_file`) after editing rather than hand-aligning.
- Preserve the whole source URL. Show it inline when it has no query string. When a URL has a query string (regardless
  of length) or is otherwise overly long, use a Markdown **reference-style link**: a shortened display label
  (host + path + `…`, e.g. `[data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/…][rnsr-all]`) as the link text and
  the complete, unaltered URL in a `[id]: <full-url>` definition collected at the bottom of the file. Only the displayed
  label is shortened, never the actual URL.
- **Source analysis (optional, closing)** — the file may end with a general prose discussion of the source and how it is
  structured (the originating system, and how its catalogue/feed/tree is organised). Place it **last**, flowing directly
  after the change log with **no section heading and no divider**. Keep it general: exclude harvester implementation
  details (crawl mechanics, request parameters and node ids, EC2U field-by-field mapping tables, and implementation
  plans) — those belong in the code or in tracked issues, not in the status record.
- Do not keep sample payloads, pending/TODO sections (track those as issues), or a separate `Legacy` block (superseded
  versions are their own sections). A retired alternative source that never had its own version may be noted as a
  struck-through entry under a short trailing `## Notes`.

## Maintenance

- Keep the relevant `.md` up to date after every change that affects how a source is harvested (source URLs, selectors,
  mapped fields, known issues).
- Keep the consolidated summary in sync: the **Knowledge Hub - Status** page on Confluence
  (https://ec2u.atlassian.net/wiki/x/b4FKF, space *Infrastructure*, page id `340427119`), a dataset × university
  integration matrix.
- Confluence is reachable through the Atlassian Rovo MCP connector (read/write page scopes; available from the desktop
  app). Fetch and update pages with the `mcp__claude_ai_Atlassian_Rovo__*` tools, using cloud id
  `d5be8c79-ba10-4633-b4c5-f9ccaae17563`.

### Status page cell requirements

Each dataset × university cell on the **Knowledge Hub - Status** page must carry, in order:

- a GitHub block-card link to the report on `main`
  (`<div data-type="block-card" data-url="https://github.com/ec2u/data/blob/main/.../<File>.md">…</div>`); the matching
  university-events report goes in the **University** row, non-university feeds (e.g. the Pavia colleges) in the **Other**
  row;
- a **brief one-line summary** of the current integration approach, consistent in wording across cells of the same kind
  (for example, all manually-curated documents read "initial integration with data loaded from a manually curated
  sheet", with population caveats phrased identically: "created but yet to be populated");
- a **background colour** matching the integration status per the Services page status legend
  (https://ec2u.atlassian.net/wiki/spaces/infrastructure/pages/248709121/Services#Status):
  `#e3fcef` green = Operational service, `#fffae6` yellow = Demonstrator available, `#ffebe6` pink = Activity underway,
  `#eae6ff` purple = No information available / Activity not started.

Leave task-list items (`data-type="task-list"`) and Contacts expandos (`<details>`) untouched when editing cells.

**Commit checklist**: when a commit changes how a source is harvested, update that source's integration-notes `.md`
and the Confluence **Knowledge Hub - Status** page in the same change before committing.

# Issue Tracking

Issues live in `ec2u/data` and belong to the Knowledge Hub project (`github.com/orgs/ec2u/projects/8`).

## Titles

- No type prefix: the kind of work is carried by the GitHub **Type** field (Feature/Task/Bug), never repeated in the
  title.
- No dataset or university breadcrumb prefixes (for example `Events › Pavia › …`): that scope is carried by labels.
- Write each title as a readable, standalone description of the work.

## Labels

- **Type** is set via the GitHub **Type** field, not via labels.
- `set:<dataset>` (light green `c2e0c6`) tags the major KH dataset(s) an issue touches: `set:courses`,
  `set:programs`, `set:events`, `set:documents`, `set:persons`, `set:units`, `set:organizations`,
  `set:universities`. Apply one per affected dataset.
- `uni:<city>` (light blue `c5def5`) tags university-specific issues: `uni:coimbra`, `uni:iasi`, `uni:jena`,
  `uni:linz`, `uni:pavia`, `uni:poitiers`, `uni:salamanca`, `uni:turku`, `uni:umea`. Omit for cross-university work.

# Development

## Branching

Branch issue work off `next` (the integration branch), not `main`. Issue branches follow the
`{type}/gh-{number}-{slug}` convention and merge back into `next`.

## Workflow

1. Java backend runs on port 8080 serving both API and static assets
2. During development, run `npm start` to start Vite dev server with API proxy
3. Frontend changes are hot-reloaded, backend changes require restart
4. Maven handles the full build including frontend bundling for production

## Backend Commands

- **Build**: `mvn compile` - Compiles Java sources and builds frontend assets
- **Test**: `mvn test` - Runs JUnit tests
- **Run locally**: `java -cp target/classes:target/libs/* eu.ec2u.data.Data` - Starts the server on localhost:8080
- **Data processing**: `java -cp target/classes:target/libs/* eu.ec2u.data.Boot` - Runs all dataset processing pipelines
- **Clean**: `mvn clean` - Removes target directory and node_modules

## Frontend Commands

- **Start dev server**: `npm start` - Starts Vite dev server with hot reload (proxies API calls to localhost:8080)
- **Build**: `npm run build` - Builds optimized frontend assets
- **Install dependencies**: `npm install`

## Deployment Commands

- **Deploy**: `mvn appengine:deploy` - Deploys to Google App Engine
- **Deploy with staging**: `mvn compile appengine:deploy -Dgae.version=staging -Dgae.promote=false`
