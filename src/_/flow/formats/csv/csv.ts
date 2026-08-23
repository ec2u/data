/*
 * Copyright © 2020-2026 EC2U Alliance
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * CSV parsing task.
 *
 * @module
 */

import type { Task } from "@metreeca/pipe";
import { log } from "@metreeca/tape";
import { parse } from "csv-parse";
import { pipeline, Readable } from "node:stream";
import type { Record } from "./index.js";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a CSV parsing task.
 *
 * The generated task reads CSV text and byte streams as streams of records, one {@link Record} per data row.
 *
 * Chunks are pulled from the source as records are asked for, so sources of any size are handled without holding them
 * in memory and a consumer that stops early releases the source; some chunks are nonetheless read ahead of the
 * records actually consumed, and a source reporting the whole text at once is parsed in one go.
 *
 * > [!WARNING]
 * > Records that cannot be parsed are skipped and reported to the log, leaving the stream to run to completion.
 *
 * @typeParam R The type of the reported records; field values are reported as parsed, without being validated
 *              against it
 *
 * @param options The parsing options
 * @param options.header Reads the first row as column labels, keying records by label rather than by positional
 *                       index; defaults to `false`
 * @param options.skip Ignores empty lines rather than reporting them as records; defaults to `false`
 * @param options.trim Strips surrounding whitespace from field values; defaults to `false`
 * @param options.flex Reports records whose field count doesn't match the header, leaving out missing fields and
 *                     discarding fields beyond the header, rather than skipping them; defaults to `false`
 * @param options.quote The character wrapping field values; defaults to `"` if unset or empty
 * @param options.delimiter The character separating fields; defaults to `,` if unset or empty
 *
 * @returns A task converting a stream of CSV text or byte chunks into a stream of records
 *
 * @throws Error While iterating the returned stream, whatever the source reports while producing chunks
 */
export function csv<R extends Record = Record>({

	header,

	skip,
	trim,
	flex,

	quote,
	delimiter

}: {

	readonly header?: boolean

	readonly skip?: boolean
	readonly trim?: boolean
	readonly flex?: boolean

	readonly quote?: string
	readonly delimiter?: string

} = {}): Task<string | Uint8Array, R> {

	return async function* (chunks) {

		// built per application, so nothing is read until the first record is pulled

		const parser = parse({

			columns: header === true,

			quote: quote || "\"",
			delimiter: delimiter || ",",

			skipEmptyLines: skip === true,
			trim: trim === true,
			relaxColumnCount: flex === true,

			skipRecordsWithError: true,
			onSkip: error => void logger.warn`(${error?.lines}) malformed record (${error?.message})`

		});

		// `pipeline()` rather than `pipe()`, to destroy the source when the consumer stops early
		// piped rather than handed the whole text, which would buffer every record
		// the idle callback keeps source failures from throwing unhandled: they are reported on the parser

		pipeline(Readable.from(chunks), parser, () => {});

		// delegation keeps the pull chain intact, forwarding a downstream `return()` to the parser

		yield* parser;

	};

}
