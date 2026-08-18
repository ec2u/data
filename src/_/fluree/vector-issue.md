---
title: Expose vector index lifecycle over HTTP and the CLI, mirroring the BM25 surface
---

**challenge / use case**

BM25 graph sources can be managed from outside the server process; vector graph sources cannot be managed from outside
it at all. On `fluree/server:4.1.5`:

```bash
curl -X POST http://localhost:8090/v1/fluree/bm25/create ...    # 201
curl -X POST http://localhost:8090/v1/fluree/vector/create ...  # 404

fluree bm25 create --name test-search --ledger test:main -f index-query.json
fluree vector --help                                            # no such command
```

The query path is closed too, so this is not only about creation:

```json
{"error":"Query error: Invalid query: VectorSearch requires ExecutionContext.vector_provider (not configured)",
 "status":400,"@type":"err:db/InvalidQuery"}
```

The gating is the one described in the scope note of #1596: `vector` is a non-default feature of `fluree-db-api`, and
neither `fluree-db-server` nor `fluree-db-cli` enables it. An HTTP or Docker deployment therefore cannot use HNSW at
all, only consumers linking the Rust library into their own binary.

**proposal**

Give vector indexes the lifecycle surface BM25 already has:

- `POST /v1/fluree/vector/create` and `POST /v1/fluree/vector/sync`
- `fluree vector create | list | sync | drop`, with `--embedding-property` and `--dimensions` added to the `bm25`
  flags, and `metric`, `connectivity`, `expansion_add` and `expansion_search` carried over from `VectorCreateConfig`

This implies enabling the `vector` feature in the distributed builds, otherwise the endpoints would exist while the
provider stayed absent.

**alternatives**

Building the index from a Rust program against the same storage path, as the documentation suggests, asks every
deployment to add a Rust toolchain for index maintenance, and on a stock server queries still fail with
`vector_provider (not configured)`.

Delegating to `fluree-search-httpd` works only outside a Fluree query: "the main Fluree server does not yet route
those queries to a remote service".

The inline `dotProduct`, `cosineSimilarity` and `euclideanDistance` functions work well from SPARQL and need no index,
but being exact and brute-force they suit small candidate sets rather than ANN over a large corpus.

**notes**

Verified on `fluree/server:4.1.5` and against `main` as of 2026-08-18. Related on the embedded vector path: #1596 and
#1661.
