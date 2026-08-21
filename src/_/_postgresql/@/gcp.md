---
title: PostgreSQL on Google Cloud
summary: Cloud SQL for PostgreSQL 18 as a JSON document store with joins, full-text search and vector search
description: |
  Working notes on delivering plain PostgreSQL through Google Cloud: which versions Cloud SQL offers and how it
  compares with AlloyDB and Spanner, how the jsonb document and join model works, which full-text and vector
  facilities the extension allowlist provides, what the managed service withholds, and how to connect from
  TypeScript.
---

# Verdict

Plain upstream PostgreSQL on Cloud SQL covers documents, joins, full-text search and vector search with **no
capability gap**. Everything except `pgvector` is core, so there is no extension risk and no licensing asterisk, and
`pgvector` is on the Cloud SQL allowlist.

The trade-off is a managed service that admits no extensions of its own, which rules out BM25 ranking and Cypher
traversal. See [Limits](#limits).

# Service Options

| Service        | PostgreSQL versions       | Entry cost     | Character                      |
|----------------|---------------------------|----------------|--------------------------------|
| **Cloud SQL**  | 9.6 to 18, default **18** | ~10 EUR/month  | Plain upstream PostgreSQL      |
| **AlloyDB**    | 14 to 18, default 17      | ~250 EUR/month | Compatible, columnar, ScaNN    |
| **Spanner PG** | Dialect subset            | Per-node       | Horizontal scale, low fidelity |

Cloud SQL is the only one of the three that is actually PostgreSQL. AlloyDB is Postgres-compatible with a columnar
engine for analytics, and its floor is roughly 25 times the Cloud SQL floor, so it needs a specific reason. Spanner
supports `JSONB` and joins but implements only a subset of the dialect, drops behaviours such as implicit
`jsonb`-to-text coercion, and admits no extensions at all, so it is a different decision rather than a cheaper one.

## Versions and Support

PostgreSQL 18 is GA on Cloud SQL and the **default for new instances**. It entered preview on 2025-10-03, about a week
after upstream GA. Minor versions trail upstream slightly, 18.4 against 18.6.

- **Regular support**: 17 to 2030-02-01, 16 to 2029-02-01, 15 to 2028-02-01
- **Extended support**: three further years past community EOL, billable since 2025-05-01
- **Forced upgrade**: instances are moved to the current default once extended support ends, with at least twelve
  months of deprecation notice

# Documents and Joins

All core, no extensions:

```sql
create index on customers ((doc->>'id'));            -- join key, expression btree
create index on customers using gin (doc);           -- containment, @> ? @? @@

select o.doc->>'id', li.sku, p.doc->>'title'
from orders o,
     json_table(o.doc, '$.lines[*]' columns (sku text path '$.sku')) li
join products p on p.doc->>'sku' = li.sku;
```

`JSON_TABLE` needs 17 or later. Recursive CTEs cover transitive traversal, `jsonb_agg` shapes results back into
documents, and `LATERAL` expands arrays where `JSON_TABLE` is more machinery than the case warrants.

> [!IMPORTANT]
> A GIN index answers containment and existence (`@>`, `?`, `@?`, `@@`) but never `->>`. Equality on an extracted
> path needs its own expression btree index. This is the usual reason a "PostgreSQL is slow at JSON" measurement is
> measuring the wrong thing.

Keep documents small. Values in the hundreds of kilobytes are compressed and pushed out of line by TOAST, and every
field read then decompresses the whole value. Hot fields belong in real columns.

# Full-Text Search

Core `tsvector`/`tsquery` with GIN, plus `pg_trgm` 1.6, `unaccent` 1.1, `fuzzystrmatch` 1.2, `btree_gin` 1.3 and
`btree_gist` 1.8 from the allowlist. Store the search vector as a generated column and index it:

```sql
alter table docs add column fts tsvector generated always as (
  setweight(to_tsvector('english', coalesce(doc->>'title','')), 'A') ||
  setweight(to_tsvector('english', coalesce(doc->>'body','')),  'B')
) stored;

create index docs_fts on docs using gin (fts);

select doc->>'title', ts_rank_cd(fts, q) as rank
from docs, websearch_to_tsquery('english', $1) q
where fts @@ q
order by rank desc limit 20;
```

# Vector Search

`pgvector` 0.8.0 per the extensions page, 0.8.1 on maintenance versions from `R20251004.01_19`. Upstream is at 0.8.2.

| Type        | Storage maximum      | Index maximum        |
|-------------|----------------------|----------------------|
| `vector`    | 16,000 dimensions    | 2,000 dimensions     |
| `halfvec`   | 16,000 dimensions    | 4,000 dimensions     |
| `bit`       |                      | 64,000 dimensions    |
| `sparsevec` | 16,000 non-zero      | 1,000 non-zero       |

- **Indexes**: HNSW and IVFFlat, tuned through `m`/`ef_construction` and `lists` respectively
- **Operators**: `<=>` cosine, `<->` L2, `<#>` inner product, `<+>` L1, plus `<~>` Hamming and `<%>` Jaccard for bits
- **Iterative index scans**: new in 0.8, they fix overfiltering where a `WHERE` clause starves the result set below
  the `LIMIT`, bounded by `hnsw.max_scan_tuples` and `ivfflat.max_probes`
- **Embeddings in-database**: `google_ml_integration` 1.4.3 exposes `google_ml.embedding()` against Vertex AI, so no
  external pipeline is needed to populate or query a vector column

```sql
create extension vector;

alter table docs add column embedding vector(768);

create index on docs using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);
```

Hybrid search is reciprocal rank fusion over the two retrievers, ordinary SQL over a keyword CTE and a vector CTE
joined on id, and needs nothing beyond the facilities above.

# PostgreSQL 18 Specifics

- **Parallel GIN index builds**: cut full-text index build and reindex time on multi-vCPU instances, governed by
  `max_parallel_maintenance_workers` and `maintenance_work_mem`
- **Btree skip scan**: multicolumn indexes now serve queries with no restriction on leading columns, which helps the
  filter side of hybrid queries
- **`gin_index_check()`**: GIN verification through amcheck
- **Estonian stemming**: added to the Snowball dictionaries

> [!WARNING]
> Full-text search now reads configuration files and dictionaries using the cluster's default collation provider
> rather than always using libc. Clusters defaulting to ICU or the builtin provider should reindex all full-text and
> `pg_trgm` indexes after upgrading.

# Limits

- **No custom extensions**: allowlist only, and new entries go through Google's issue tracker
- **No BM25**: `pg_search`, `pgroonga` and `rum` are all absent, so ranking is limited to `ts_rank`/`ts_rank_cd`,
  which are cover-density heuristics rather than a relevance model
- **No ScaNN**: it stays an AlloyDB feature, so Cloud SQL gets stock `pgvector` performance
- **No `pg_jsonschema`**: document validation falls to `CHECK` constraints or the application
- **No graph query language**: Apache AGE is unavailable, and SQL/PGQ needs PostgreSQL 19, in beta upstream with GA
  expected around 2026-10, so not on Cloud SQL before 2027 on the version cadence observed for 18
- **No file-based text search dictionaries**: synonym, thesaurus and ispell dictionaries read from
  `$SHAREDIR/tsearch_data` and there is no filesystem access ¹

# Connecting from TypeScript

The Cloud SQL connector officially supports `pg`, `mysql2` and `tedious`, which settles the driver choice.

```bash
npm i pg @google-cloud/cloud-sql-connector
npm i -D @types/pg
```

`pg` ships no bundled type declarations, hence the separate `@types/pg`.

```ts
import { Connector } from "@google-cloud/cloud-sql-connector";
import pg from "pg";

const connector=new Connector();

const options=await connector.getOptions({
	instanceConnectionName: "project:region:instance",
	authType: "IAM",
	ipType: "PUBLIC" // or "PRIVATE" / "PSC"
});

export const pool=new pg.Pool({
	...options,
	user: "service-account@project.iam",
	database: "pipe",
	max: 5
});
```

The connector handles TLS and certificate rotation itself, so no Auth Proxy sidecar and no password under
`authType: "IAM"`. The principal needs the **Cloud SQL Client** role. Local development against a plain container
skips the connector and passes `connectionString` instead.

| Package                             | Weekly | Version | License    | Notes                                |
|-------------------------------------|--------|---------|------------|--------------------------------------|
| `pg`                                | 39.2M  | 8.23.0  | MIT        | Types ship separately as `@types/pg` |
| `@google-cloud/cloud-sql-connector` |        | 1.11.3  | Apache-2.0 | Requires Node >= 22                  |

Driver behaviours worth knowing:

- **`int8` arrives as a string**: `bigint` exceeds `Number.MAX_SAFE_INTEGER`, so `pg` returns text unless a parser is
  registered through `pg.types.setTypeParser`
- **`jsonb` is transparent**: parsed into an object on read, serialised on write, so no manual `JSON.stringify`
- **Vector columns arrive as strings**: the `pgvector` package (0.3.0, MIT, Node >= 22) registers the type parser and
  offers a `pgvector/pg` export
- **Pool sizing is per instance**: on Cloud Run, `max` multiplied by the maximum instance count must stay under the
  Cloud SQL connection limit, so keep `max` small

# Notes

Researched 2026-08-18. HNSW builds are bound by `maintenance_work_mem`, so raise the flag before indexing and size the
instance for the index rather than for the table.

¹ Inferred from the absence of filesystem access rather than from an explicit Google statement. Worth confirming if a
custom dictionary turns out to be load-bearing.

# References

- [Cloud SQL database versions and version policies](https://docs.cloud.google.com/sql/docs/postgres/db-versions)
- [Cloud SQL PostgreSQL extensions](https://docs.cloud.google.com/sql/docs/postgres/extensions)
- [Generate vector embeddings with model endpoint management](https://docs.cloud.google.com/sql/docs/postgres/model-endpoint-embeddings)
- [PostgreSQL 18 release notes](https://www.postgresql.org/docs/release/18.0/)
- [PostgreSQL JSON functions and operators](https://www.postgresql.org/docs/current/functions-json.html)
- [pgvector](https://github.com/pgvector/pgvector)
- [Cloud SQL Node.js connector](https://github.com/GoogleCloudPlatform/cloud-sql-nodejs-connector)
