This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# References

## Utilities

- [Dedent](https://github.com/dmnd/dedent) - ES6 string tag that strips indentation from multi-line strings
- [@metreeca/flow](https://github.com/metreeca/flow) - TypeScript library for processing async iterables with
  composable, type-safe pipelines

## Google Cloud Platform

- [Google GenAI SDK](https://googleapis.github.io/js-genai/release_docs/index.html) - Google Generative AI SDK for
  JavaScript/TypeScript
- [Google Cloud Datastore](https://cloud.google.com/nodejs/docs/reference/datastore/latest) - Google Cloud Datastore
  client library
- [Google Cloud Secret Manager](https://cloud.google.com/nodejs/docs/reference/secret-manager/latest) - Google Cloud
  Secret Manager client library
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
	- [API Keys and Authentication](https://ai.google.dev/gemini-api/docs/api-key)
	- [Gemini Models](https://ai.google.dev/models)
	- [API Pricing](https://ai.google.dev/pricing)
	- [Rate Limits](https://ai.google.dev/rate-limits)

# Data Source Integration Notes

Each pipe carries a standalone integration-notes Markdown file alongside it (for example,
`src/events/pipes/turku-university.md` next to `turku-university.ts`). The file is the authoritative, non-technical
status record for that source and must read as a brief standalone document.

## Structure

- **Front matter** — YAML with `title`, `summary`, `description`, and `status` (`active`, or `planned` for a source not
  yet integrated). The `title` is a breadcrumb following the pipe name segments, `Dataset › University` (e.g.
  `Events › Turku › University`, `Events › Iași › University › 360`, `Events › Pavia › Ghislieri`). No H1 heading: the
  title lives in the front matter. Do not duplicate the university or dataset (already in the title) or a version date
  (already the newest version section) as separate keys.
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
- Record what a maintainer must respect to re-derive the crawl: the endpoints and selectors the pipe depends on, and
  the quirks that forced them (a form post where a page renders nothing of its own, a pager stating fragments rather
  than addresses, a card linking its event more than once).
- Use en dashes (`–`) as the date/label separator; ISO dates and list bullets keep hyphens; no em dashes.
- Inline source URLs make some table rows exceed 120 columns; that is accepted for these reports. Run the IDE formatter
  (`mcp__idea__reformat_file`) after editing rather than hand-aligning.
- Preserve the whole source URL. Show it inline when it has no query string. When a URL has a query string (regardless
  of length) or is otherwise overly long, use a Markdown **reference-style link**: a shortened display label
  (host + path + `…`) as the link text and the complete, unaltered URL in a `[id]: <full-url>` definition collected at
  the bottom of the file. Only the displayed label is shortened, never the actual URL.
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

**Commit checklist**: when a commit changes how a source is harvested, update that source's integration-notes `.md` and
the Confluence **Knowledge Hub - Status** page in the same change before committing.

# Task Workflows

## NPM Scripts

- **`npm run clean`** - Remove dependencies and build artefacts
- **`npm run prime`** - Install dependencies from the lockfile and configure the GCP project
- **`npm run setup`** - Configure for local development
- **`npm run build`** - Compile sources and copy `*.sys.md` prompts alongside their modules
- **`npm run check`** - Run the test suite
- **`npm run serve`** - Serve the endpoints in watch mode

## Testing

- **Run a single test file**: `npm run check -- path/to/test.ts`

## Probing the Store

To check what a pipe actually committed, write a throwaway script under `src/` named `~probe.ts` (the `~*` pattern is
gitignored) and run it with `npx tsx`, then delete it. Pipe logs are not evidence: writes are buffered and flushed as a
single update when the transaction commits, so an `inserted resource` line only records that the delta was queued.

Two levels of probe are available, and they answer different questions.

**Shape level** - what the application sees. Bind the services through `execute()` from `@/index.core.js` and read
through `store.lookup()`:

```ts
import { createStore } from "@/_/gear-store/index.js";
import { execute } from "@/index.core.js";
import { Taxonomy } from "@/taxonomies/index.js";
import { service } from "@metreeca/gear";

await execute(async () => {

	const stated = await service(createStore).lookup({
		entry: "https://data.ec2u.eu/taxonomies/isced-2011",
		shape: Taxonomy,
		model: { label: {}, resources: { id: {}, digest: {} } }
	});

	console.log(JSON.stringify(stated, null, 2));

});
```

Every leaf is the empty object `{}`, and a collection carries its criteria on the entry naming it rather than in a
tuple beside it: a model states which values are wanted and never what they are, leaving type and cardinality to the
shape. The model is still validated against the shape, so a property the shape does not declare fails the call with a
`TraceError [RangeError]: invalid model` naming the offending path. A property that comes back absent means the shape
did not resolve it, not that the data is missing: confirm at the triple level before concluding anything.

**Triple level** - what the repository holds. Open the RDF4J repository directly, taking credentials from the vault:

```ts
import { createGCPVault } from "@/_/gear-gcp/secrets.js";
import { createFetch } from "@metreeca/http";
import { basic } from "@metreeca/http/basic";
import { createRDF4JRepository } from "@metreeca/wire-sparql-rdf4j";

const vault = createGCPVault();

const repository = createRDF4JRepository({
	server: "https://graphdb.ec2u.net",
	repository: "data-work",
	fetch: createFetch(basic(await vault("gdb-server-usr"), await vault("gdb-server-pwd")))
});

await repository.execute(async client => {
	for ( const tuple of await client.select(`select ?p (count(*) as ?n) where { <…> ?p ?o } group by ?p`) ) {
		console.log(JSON.stringify(tuple));
	}
});
```

`client.select()` resolves to an array of tuples, not an async iterable, and the companion `ask()`, `construct()` and
`update()` take the same form. Counting predicates forward from a resource and reverse into it is enough to settle
whether a run committed and which links it left behind.

## Diagnosing a Stalled Pipe

A pipe that logs its crawl and then parks, with no error and nothing further printed, is waiting on the store rather
than on the source: a sink settles its retrievals before it processes the first page, so an unanswered `lookup()`
holds the whole pipeline with nothing to show for it. Cached pages make this look like progress, since the crawl
completes without touching the network.

Check the endpoint before reading any code, as it costs seconds and needs no credentials:

```sh
curl -sS -o /dev/null -w "tcp=%{time_connect}s tls=%{time_appconnect}s total=%{time_total}s\n" \
	--max-time 20 https://graphdb.ec2u.net/
```

Fast `tcp` and `tls` times followed by a `total` running out to the timeout with zero bytes received place the fault
in the infrastructure: the host and its TLS terminator are up and GraphDB behind them is not answering, so no change
to a pipe or a retrieval model will move it. Reach for the two probes above only once the endpoint answers.
