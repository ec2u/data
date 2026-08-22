---
title: CSV Parsing for Node
summary: csv-parse as the taxonomy CSV reader, and how it feeds @metreeca/pipe
description: |
  Working notes on the CSV reader used for taxonomy ingestion: how the csv-parse Node stream and synchronous entry
  points feed @metreeca/pipe, and why its Web Streams entry point does not type-check under the project's current
  type environment.
---

# Verdict

**`csv-parse`**, from the Adaltas [node-csv](https://csv.js.org/parse) family, installed as `csv-parse@^7.0.2`.

It carries **no runtime dependencies**, ships dual ESM/CJS exports with bundled type declarations, and returns a Node
`Transform` that feeds `@metreeca/pipe` with no adapter.

# Pipe Interoperability

`@metreeca/pipe` declares its source type as `Data<V> = V | readonly V[] | Iterable<V> | AsyncIterable<V> | Pipe<V>`, so
a parser that **is** an async iterable drops straight into `items()`. The `Parser` returned by `csv-parse` extends
`stream.Transform`, which satisfies the `AsyncIterable<V>` arm:

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

The same parser takes the source up front, which covers a fetched taxonomy without a stream conversion:

```ts
const response = await fetch(source);

const concepts = items<Concept>(parse(await response.text(), { columns: true, skip_empty_lines: true, trim: true }));
```

`csv-parse/sync` returns `T[]`, taken by the `readonly V[]` arm of `Data<V>`, and is the shortest path for tests and
fixtures:

```ts
import { parse } from "csv-parse/sync";

const concepts = parse<Concept>(text, { columns: true, skip_empty_lines: true, trim: true });
```

## Backpressure

A pipe pulls one item at a time and Node stream async iteration honours that end to end, so a slow downstream task
throttles the parser with no explicit flow control.

## Web Streams

`csv-parse/stream` exports `parse(options): TransformStream`, but that route **does not type-check in this project**.

The body returned by `fetch` is typed against the global `ReadableStream` that `@types/node` 24.5.2 declares through
`undici-types`, which has neither `values()` nor `[Symbol.asyncIterator]`. It therefore satisfies neither `Data<V>` nor
the `node:stream/web` `ReadableStream` that `Readable.fromWeb()` expects, and the only bridge is a type assertion.
Adding `DOM.AsyncIterable` to `lib` would settle it at the cost of pulling DOM globals into a Node service, which is a
poor trade for a path the snippet above already covers.

# Limits

- **Option naming**: snake_case options (`skip_empty_lines`, `relax_column_count`) with camelCase aliases, which reads
  against the surrounding codebase either way
- **No delimiter sniffing by default**: `delimiter_auto` has to be asked for
- **Error granularity**: a malformed record rejects the whole stream unless `skip_records_with_error` is set, in which
  case `on_skip` is the only place a diagnostic can be logged

# References

- [csv-parse documentation](https://csv.js.org/parse)
- [node-csv repository](https://github.com/adaltas/node-csv)
- [@metreeca/pipe](https://github.com/metreeca/pipe)
- [RFC 4180 Common Format and MIME Type for CSV Files](https://www.rfc-editor.org/rfc/rfc4180)
