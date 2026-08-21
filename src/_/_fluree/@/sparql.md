---
title: Fluree Integration Notes
summary: Client library status, documentation map, SPARQL coverage and HTTP endpoint shapes for Fluree DB
description: |
  Survey of the options for driving Fluree from TypeScript, covering the current documentation locations, the
  SPARQL 1.1/1.2 feature coverage of Fluree DB v4, the HTTP endpoint pair for query and update, the local Docker
  instance and its ledger and CLI handling, and what it takes to reach the endpoints with `sparql-http-client`.
---

# Documentation

| Site                              | Covers                                          | Notes                                        |
|-----------------------------------|-------------------------------------------------|----------------------------------------------|
| `labs.flur.ee/docs/db`            | Fluree DB v4.1 (current)                        | `developers.flur.ee` 301s here               |
| `next.developers.flur.ee`         | Fluree Cloud                                    | Raw `curl`/`node-fetch` examples, no SDK     |
| `docsarchive.flur.ee`             | Fluree v2 era, including a JavaScript reference | Archived                                     |
| `github.com/fluree/fluree-client` | `@fluree/fluree-client` API                     | README is the only reference; no hosted docs |

The v4 documentation has no client-library section at all: navigation covers the CLI, HTTP API, query, transactions,
ledger configuration, security and policy, indexing, graph sources and operations.

# SPARQL Coverage

Fluree DB v4.1 reports **SPARQL 1.0 and 1.1 as supported** and **1.2 as partial** (RDF-star annotations and triple-term
accessors, with W3C 1.2 test-suite execution).

Update support is partial:

- **Supported**: `INSERT DATA` and `DELETE DATA` (including `GRAPH <iri> { ... }` named-graph blocks), `DELETE WHERE`
  (default graph only), `DELETE/INSERT WHERE` with the `DELETE { } WHERE { }` and `INSERT { } WHERE { }` short forms,
  optional `WITH`/`USING` clauses, and `GRAPH <iri> { ... }` blocks in templates
- **Rejected**: variable graph names (`GRAPH ?g { ... }`) in any update, and `GRAPH` blocks inside `DELETE WHERE`
- **Unimplemented**: `LOAD`, `CLEAR`, `DROP`, `CREATE`, `COPY`, `MOVE`, `ADD`

# HTTP Endpoints

Query and update are a matched pair, both able to carry the ledger in the path.

| Operation | Path forms                                                               | Request `Content-Type`                                                         |
|-----------|--------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| Query     | `POST /v1/fluree/query`, `POST /v1/fluree/query/{ledger}`, `GET ?query=` | `application/sparql-query`, `application/json`, `application/cypher`           |
| Update    | `POST /v1/fluree/update/{ledger}`, `?ledger=`, `Fluree-Ledger` header    | `application/sparql-update`, `application/json`, `application/cypher`          |
| Insert    | `POST /v1/fluree/insert`                                                 | `application/json`, `text/turtle`, `application/n-triples`                     |
| Upsert    | `POST /v1/fluree/upsert`                                                 | `application/json`, `text/turtle`, `application/n-triples`, `application/trig` |

Query response negotiation accepts `application/sparql-results+json`, `application/sparql-results+xml`, `text/csv`,
`text/tab-separated-values`, `application/json`, `application/ld+json` and `application/rdf+xml`. Update responses are
`application/json` only.

`{ledger}` is a `name:branch` pair such as `mydb:main`. The colon is legal unencoded in a path segment.

## Ledger Addressing

Query and update differ in how the target ledger may be named:

- **Query**: the ledger can move into the request as `FROM <mydb:main>`, so the unscoped `/query` endpoint supports
  cross-ledger requests from a single client
- **Update**: the ledger must always be supplied out of band, through the path, a `?ledger=` parameter or a
  `Fluree-Ledger` header. `WITH`, `USING` and `GRAPH <iri>` select graphs *within* the addressed ledger and cannot
  retarget it
- **Cypher**: must use the path form, having no `FROM`/dataset clause

Turtle and TriG are not accepted on `/update`; use `/insert` (Turtle) or `/upsert` (Turtle and TriG).

# Local Instance

[`docker-compose.yaml`](docker-compose.yaml) runs a single-node server from the official `fluree/server` image, exposing
port 8090 and persisting both configuration and ledger data in a named volume mounted at `/var/lib/fluree`.

```bash
docker compose -f src/_/fluree/docker-compose.yaml up -d
curl http://localhost:8090/health
```

A healthy server answers `{"status":"ok","version":"4.1.5"}`. `GET /v1/fluree/stats` reports uptime, storage type,
indexing state and cached ledger count.

> [!WARNING]
> The compose file pins `fluree/server:4.1.5` deliberately. The `latest` tag now resolves to the v4 Rust server, but
> carried the v3 Clojure server until 2026, so anything pinned to `latest` for a v3 client silently moved to an
> incompatible server.

Useful environment variables: `RUST_LOG`, `FLUREE_LISTEN_ADDR`, `FLUREE_CACHE_MAX_MB`, `FLUREE_INDEXING_ENABLED`,
`FLUREE_REINDEX_MIN_BYTES` and `FLUREE_REINDEX_MAX_BYTES`. Configuration layers resolve as CLI flags, then environment
variables, then profile overrides, then config file, then defaults.

## Ledgers

Ledgers must be created explicitly: neither `/insert` nor `/update` auto-creates one.

```bash
curl -X POST http://localhost:8090/v1/fluree/create \
  -H "Content-Type: application/json" \
  -d '{"ledger": "ec2u:main"}'
```

- **Body**: `ledger` is the only field; a bare `name` defaults the branch to `main`, so `ec2u` and `ec2u:main` are
  equivalent
- **Success**: `201`, returning the normalised `ledger_id`, `t: 0` and the initial `tx-id`
- **Conflict**: `409` when the ledger already exists
- **Listing**: `GET /v1/fluree/ledgers` returns name, branch, type and current `t` for each ledger
- **CLI**: `fluree create <ledger>`

## Command Line

The `fluree` binary is a full client covering `create`, `insert`, `upsert`, `update`, `query`, `multi-query`, `history`,
`export`, `index` and `mcp`, among others. Installation options for macOS on Apple Silicon:

```bash
# install script, binary lands in ~/.local/bin
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/fluree/db/releases/latest/download/fluree-db-cli-installer.sh | sh

# Homebrew, if available
brew install fluree/tap/fluree
```

Release `v4.1.5` also publishes `fluree-db-cli-aarch64-apple-darwin.tar.xz` with a matching `.sha256`, alongside Linux
and Windows archives. Alternatively the binary is already inside the running container and operates directly on the
mounted volume:

```bash
docker exec -it ec2u-fluree fluree list
```

## No Web UI

The v4 server is API-only. On a running 4.1.5 instance, `/`, `/ui`, `/console`, `/admin`, `/dashboard`, `/sparql`,
`/openapi.json`, `/swagger` and `/metrics` all return `404`, and the CLI exposes no `ui` subcommand or flag. The admin
console found in older material belongs to the v2 and v3 Clojure line and does not apply.

Interactive alternatives: the CLI, the `/v1/fluree/stats` and `/v1/fluree/ledgers` introspection endpoints, a generic
SPARQL GUI pointed at the read endpoint, or the `fluree mcp` subcommand for LLM-driven access.

# Search and Indexing

Two search facilities sit beside the core triple indexes, documented separately:

- [BM25 full-text search](bm25.md): indexed and manageable over HTTP and CLI, but queryable only through FQL/JSON-LD,
  never from SPARQL
- [Vector search](vector.md): the HNSW index is embedded-API-only and out of reach here, while the similarity
  functions work from plain SPARQL as a brute-force scan

# Driving Fluree from `sparql-http-client`

The endpoints are close to the W3C SPARQL Protocol but not compliant, so the client needs per-call overrides.

```typescript
const client = new ParsingClient({
	endpointUrl: "http://localhost:8090/v1/fluree/query/mydb:main",
	updateUrl: "http://localhost:8090/v1/fluree/update/mydb:main"
});

await client.query.select(sparql); // works as-is (GET ?query=)

await client.query.update(sparql, { // requires both overrides
	operation: "postDirect",
	headers: { "content-type": "application/sparql-update" }
});
```

Gaps to work around:

- **Update encoding**: `RawQuery.update()` defaults to `operation: "postUrlencoded"`, and Fluree lists no
  `application/x-www-form-urlencoded` handler on `/update`. `postDirect` is required
- **Update content type**: `SimpleClient.postDirect()` falls back to `application/sparql-query` even for updates, so
  `application/sparql-update` must be set explicitly
- **Graph parameters**: `default-graph-uri`, `named-graph-uri`, `using-graph-uri` and `using-named-graph-uri` are not
  supported. Graph selection is the ledger-scoped path or an in-query `FROM`
- **No `/sparql` service endpoint**: the paths are Fluree-specific, so `endpointUrl` and `updateUrl` must be configured
  separately rather than derived from one base

# References

- [@fluree/fluree-client on npm](https://www.npmjs.com/package/@fluree/fluree-client)
- [fluree/fluree-client on GitHub](https://github.com/fluree/fluree-client)
- [Fluree DB v4.1 HTTP API endpoints](https://labs.flur.ee/docs/db/api/endpoints)
- [Fluree DB v4.1 standards and feature flags](https://labs.flur.ee/docs/db/reference/compatibility)
- [Quickstart: run the server](https://labs.flur.ee/docs/db/getting-started/quickstart-server)
- [Running with Docker](https://labs.flur.ee/docs/db/operations/docker)
- [CLI reference](https://labs.flur.ee/docs/db/cli)
- [Downloads](https://labs.flur.ee/downloads)
- [Coming from Stardog / GraphDB](https://labs.flur.ee/guides/coming-from-enterprise-kg)
- [SPARQL 1.1 Protocol](https://www.w3.org/TR/sparql11-protocol/)
