---
title: CSV Parsing for Node
summary: csv-parse as the taxonomy CSV reader, for zero dependencies and native @metreeca/pipe interoperability
description: |
  Working notes on choosing a CSV parser for taxonomy ingestion: which packages the ecosystem still maintains, how
  each one feeds an async iterable into @metreeca/pipe, and what the streaming, Web Streams and synchronous entry
  points of the selected package look like in this codebase.
---

# Verdict

**`csv-parse`**, from the Adaltas `node-csv` family. It carries **no runtime dependencies**, ships dual ESM/CJS exports
with bundled type declarations, and exposes three entry points that all feed `@metreeca/pipe` without an adapter: a Node
`Transform`, a Web `TransformStream` and a synchronous array parser.

`papaparse` is the better known package and `d3-dsv` the more downloaded one, but neither fits a streaming ingestion
pipeline. See [Candidates](#candidates) and [Pipe Interoperability](#pipe-interoperability).

# Candidates

| Package      | Homepage                                                                   | Weekly | Version | Stars  | Updated    | License |
|--------------|----------------------------------------------------------------------------|--------|---------|--------|------------|---------|
| `csv-parse`  | [csv.js.org/parse](https://csv.js.org/parse)                               | 18.3M  | 7.0.2   | 4,282  | 2026-08-02 | MIT     |
| `papaparse`  | [papaparse.com](https://www.papaparse.com/)                                | 14.9M  | 5.6.0   | 13,547 | 2026-08-13 | MIT     |
| `fast-csv`   | [c2fo.github.io/fast-csv](https://c2fo.github.io/fast-csv)                 | 14.9M  | 5.0.7   | 1,788  | 2026-05-06 | MIT     |
| `csv-parser` | [github.com/mafintosh/csv-parser](https://github.com/mafintosh/csv-parser) | 3.3M   | 3.2.1   | 1,502  | 2026-05-07 | MIT     |

All four are MIT, actively published and free of open advisories. The separation is ergonomic rather than legal.

- **`csv-parse`**: zero runtime dependencies, RFC 4180 compliant, wide option surface (quoting, escapes, casting,
  relaxed column counts). Stewardship is single-vendor (Adaltas) over a contributor history of a hundred or more. The
  companion `csv-stringify` covers the write side.
- **`papaparse`**: the largest community and the best prose documentation, but browser-first: CJS `main` only, no
  exports map, and no bundled types, so it drags in `@types/papaparse`, last published 2025-12-13 against a package
  updated 2026-08-13. 224 open issues.
- **`fast-csv`**: TypeScript-native, with a clean parse and format split and ergonomic row validation hooks. Costs three
  `lodash.*` micro-dependencies and offers no Web Streams path.
- **`csv-parser`**: minimal and fast, but thinly maintained (64 open issues, low commit cadence), CJS only, and parse
  only, with no writer.

`d3-dsv` leads the field on downloads at 20.1M weekly, but that figure is inflated by the `d3` bundle pulling it in
transitively. It parses whole strings in memory with no streaming interface, so it is ruled out on shape rather than on
health.

# Pipe Interoperability

`@metreeca/pipe` declares its source type as `Data<V> = V | readonly V[] | Iterable<V> | AsyncIterable<V> | Pipe<V>`, so
any parser that **is** an async iterable drops straight into `items()`. That single test reorders the field: three of
the four candidates return a Node `Transform`, which is async-iterable, while `papaparse` is push-based and needs a
hand-written bridge.

| Package      | Feeds `items()` as                                                                | Adapter         |
|--------------|-----------------------------------------------------------------------------------|-----------------|
| `csv-parse`  | `Parser extends stream.Transform`; `/stream` → `TransformStream`; `/sync` → `T[]` | none, all three |
| `fast-csv`   | `CsvParserStream extends Transform`                                               | none            |
| `csv-parser` | `Transform`                                                                       | none            |
| `papaparse`  | `step`/`complete` callbacks                                                       | required        |

## Streaming

The default entry point returns a `Parser`, consumed through the `AsyncIterable<V>` arm of `Data<V>`:

```ts
import { pipe } from "@metreeca/pipe";
import { items } from "@metreeca/pipe/feeds";
import { toArray } from "@metreeca/pipe/sinks";
import { createReadStream } from "node:fs";
import { parse } from "csv-parse";

interface Concept {

	readonly id: string;
	readonly label: string;

}

pipe(
	(items<Concept>(createReadStream("work.csv").pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))))
	(toArray())
);
```

> [!IMPORTANT]
> Name the row type at `items<Concept>` rather than casting the parser. `Transform` is typed `AsyncIterable<any>` and
> `any` is assignable to `Data<Concept>`, so the annotation lands with no `as` and no post-write audit exception.

## Web Streams

`csv-parse/stream` exports `parse(options): TransformStream`, so a `fetch` body reaches the pipe without touching
`node:stream`:

```ts
import { items } from "@metreeca/pipe/feeds";
import { parse } from "csv-parse/stream";

const response = await fetch(source);

const concepts = items<Concept>(response.body!.pipeThrough(parse({ columns: true })));
```

This works because the project `tsconfig` declares no `DOM` lib, so the global `ReadableStream` resolves to the
`@types/node` declaration, which types `[Symbol.asyncIterator]`. Under a `DOM` lib the same line needs explicit
`node:stream/web` imports.

## Synchronous

`csv-parse/sync` returns `T[]`, taken by the `readonly V[]` arm of `Data<V>`. Adequate for taxonomy files that fit in
memory, and the shortest path for tests and fixtures:

```ts
import { parse } from "csv-parse/sync";

const concepts = parse<Concept>(text, { columns: true, skip_empty_lines: true, trim: true });
```

## Backpressure

A pipe pulls one item at a time and Node stream async iteration honours that end to end, so a slow downstream task
throttles the parser without any explicit flow control. `papaparse` inverts this: its `step` callback pushes rows at
whatever rate the parser reaches them, and holding it back means driving `parser.pause()` and `parser.resume()` by hand.
That, rather than its metrics, is what disqualifies it here.

# Limits

- **Option naming**: `csv-parse` uses snake_case options (`skip_empty_lines`, `relax_column_count`) with camelCase
  aliases, which reads against the surrounding codebase either way
- **Unpacked size**: 1.6 MB against 265 kB for `papaparse`, because the package ships ESM, CJS and browser builds side
  by side; irrelevant on Cloud Run, relevant if any of this is ever bundled for a browser
- **No delimiter sniffing by default**: `delimiter_auto` has to be asked for, where `papaparse` guesses unprompted
- **Error granularity**: a malformed record rejects the whole stream unless `skip_records_with_error` is set, in which
  case `on_skip` is the only place a diagnostic can be logged

# Notes

Researched 2026-08-22. Metrics are npm weekly downloads for 2026-08-15 to 2026-08-21 and GitHub counts on the same date.
Contributor counts read 100 or more for `csv-parse` and `papaparse`, 63 for `fast-csv` and 31 for `csv-parser`.

# References

- [csv-parse documentation](https://csv.js.org/parse)
- [node-csv repository](https://github.com/adaltas/node-csv)
- [Papa Parse](https://www.papaparse.com/)
- [fast-csv documentation](https://c2fo.github.io/fast-csv)
- [csv-parser repository](https://github.com/mafintosh/csv-parser)
- [@metreeca/pipe](https://github.com/metreeca/pipe)
- [RFC 4180 Common Format and MIME Type for CSV Files](https://www.rfc-editor.org/rfc/rfc4180)
