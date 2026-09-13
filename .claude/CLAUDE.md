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
		model: { label: "", resources: [{ id: "", digest: "" }] }
	});

	console.log(JSON.stringify(stated, null, 2));

});
```

The `model` is validated against the shape, so a mismatched field fails the call with a `TraceError [RangeError]:
invalid model` naming the offending path: `label: {}` is rejected where the shape declares a plain `string`, and `""`
is the right placeholder. A property that comes back absent means the shape did not resolve it, not that the data is
missing: confirm at the triple level before concluding anything.

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
