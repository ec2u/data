---
title: Fluree Vector Search
summary: HNSW vector indexes and SPARQL similarity functions on Fluree DB v4, and which of the two is reachable
description: |
  Working notes on Fluree DB v4.1 vector support, covering the HNSW graph-source index and its embedded-only
  management surface, the literal forms embeddings must take in JSON-LD and Turtle, and the built-in similarity
  functions that make brute-force vector search work from plain SPARQL.
---

# Two Mechanisms

Fluree offers two unrelated ways to do vector similarity, and they differ in what a Docker deployment can reach:

- **HNSW index**: a graph source built over an embedding property, approximate and fast, but created and managed
  **only through the embedded Rust API**
- **Similarity functions**: `dotProduct`, `cosineSimilarity` and `euclideanDistance` evaluated inline, exact and
  brute-force, available from **plain SPARQL** with no index at all

For a server reached over HTTP, only the second is usable.

# HNSW Index

Creation is Rust-API-only. There is no HTTP endpoint and no CLI subcommand. The documentation shipped inside the
4.1.5 binary states it directly: "**HTTP/Docker users:** there is no HTTP endpoint for creating vector indexes today.
Index creation is Rust-API-only." The API endpoint reference repeats it: "Vector index lifecycle management has no
HTTP endpoint yet and is still managed via the Rust API."

```rust
let config = VectorCreateConfig::new("products-vector", "mydb:main", query, "ex:embedding", 384);
fluree.create_vector_index(config).await?;
```

| Field                 | Default  | Notes                                          |
|-----------------------|----------|------------------------------------------------|
| `name`                | required | Graph-source name                              |
| `ledger`              | required | Source ledger alias                            |
| `query`               | required | Selection query identifying the documents      |
| `embedding_property`  | required | Property holding the vector                    |
| `dimensions`          | required | Vector size                                    |
| `metric`              | `Cosine` | Also `Dot` and `Euclidean`                     |
| `connectivity`        | `16`     | HNSW `M`                                       |
| `expansion_add`       | `128`    | HNSW `efConstruction`                          |
| `expansion_search`    | `64`     | HNSW `efSearch`                                |

Management is likewise embedded: `sync_vector_index`, `resync_vector_index` for a full rebuild, and
`drop_vector_index`. Once built, the index is queried through the same graph-source form as BM25, substituting
`f:queryVector` for `f:searchText`.

> [!WARNING]
> On `fluree/server:4.1.5`, `POST /v1/fluree/vector/create` returns `404` and `fluree --help` lists no `vector`
> command, against a `bm25` command that does exist.

## Reaching an HNSW Index Anyway

The documented workaround is to build the index out of band and let the server read it: "create the index using a
Rust program (or the Rust API embedded in your application) against the same storage path your Fluree server reads,
then run queries normally via `POST /v1/fluree/query`".

Two obstacles stand in the way of that on the stock image:

- **Vector provider**: querying a vector graph source on the running server fails with
  `Query error: Invalid query: VectorSearch requires ExecutionContext.vector_provider (not configured)` and status
  `400`. The query layer recognises the construct, but no provider is wired into the server process
- **Compile-time gate**: HNSW support sits behind the non-default `vector` Cargo feature (`usearch`), which is also
  absent from the `full` convenience bundle, so a stock build may not carry it at all

A third route exists but does not close the loop either. The standalone `fluree-search-httpd` binary, mounted on the
same storage volume, serves vector queries over its own `POST /v1/search` with the `vector` and `vector_similar_to`
query kinds. The main server does not delegate to it: "the main Fluree server does not yet route those queries to a
remote service ... Transparent delegation from inside a Fluree query is a planned follow-up; the wiring is in place
but the deployment config is not yet persisted by `create_vector_index`." Vector search through that service is
therefore reachable only outside a Fluree query, as a separate call with its own protocol.

# Embedding Literals

Vectors must carry the vector datatype so that array structure survives storage. A plain array is decomposed into
individual RDF values, where duplicates may be dropped, and will not work for similarity.

JSON-LD, using `@vector`, `f:embeddingVector` or the full IRI `https://ns.flur.ee/db#embeddingVector`:

```json
{ "ex:embedding": { "@value": [0.1, 0.2, 0.3], "@type": "@vector" } }
```

Turtle and SPARQL Update, as a typed literal:

```sparql
PREFIX ex: <http://example.org/>
PREFIX f: <https://ns.flur.ee/db#>

INSERT DATA {
  ex:d1 ex:embedding "[0.9, 0.1]"^^f:embeddingVector .
  ex:d2 ex:embedding "[0.1, 0.9]"^^f:embeddingVector
}
```

# Similarity in SPARQL

The similarity functions operate on stored vector literals and need no index, at the cost of scanning every candidate
binding.

```sparql
PREFIX ex: <http://example.org/>
PREFIX f: <https://ns.flur.ee/db#>

SELECT ?doc ?score
WHERE {
  VALUES ?q { "[0.8, 0.2]"^^f:embeddingVector }
  ?doc ex:embedding ?v .
  BIND(dotProduct(?v, ?q) AS ?score)
}
ORDER BY DESC(?score)
```

Verified against the local instance with `ex:d1` at `[0.9, 0.1]` and `ex:d2` at `[0.1, 0.9]`, queried with
`[0.8, 0.2]`:

| Function            | `ex:d1` | `ex:d2` |
|---------------------|---------|---------|
| `dotProduct`        | 0.740   | 0.260   |
| `cosineSimilarity`  | 0.991   | 0.348   |
| `euclideanDistance` | 0.141   | 0.990   |

Scores come back as `xsd:double` literals, so ordering and thresholds work normally. Since this is a full scan,
restrict the candidate set with ordinary triple patterns and filters before the `BIND`, and treat result counts as
the cost driver.

# Embeddings

There is no built-in embedding generation. Vectors are supplied by the client, so the pipeline computes them
externally and writes them as typed literals along with the rest of the data.

# References

- [Vector search](https://labs.flur.ee/docs/db/indexing-and-search/vector-search)
- [Indexing and search overview](https://labs.flur.ee/docs/db/indexing-and-search)
- [Local instance and endpoint notes](sparql.md)
- [BM25 full-text search notes](bm25.md)
