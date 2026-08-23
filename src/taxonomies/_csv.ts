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
 * CSV parsing.
 *
 * Reads CSV text and byte streams as streams of records, for consumption as `@metreeca/pipe` tasks.
 *
 * @module
 */

import type { Task } from "@metreeca/pipe";
import { log } from "@metreeca/tape";
import { parse } from "csv-parse";
import { pipeline, Readable } from "node:stream";


const logger=log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * A CSV record.
 *
 * Reports the value of each field of a data row, keyed by column label or by positional index according to the
 * parsing options.
 */
export type Record = {

	readonly [label: string]: string

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a CSV parsing task.
 *
 * The returned task reports a record for each data row fed to it, pulling chunks as records are asked for: nothing is
 * retained in full and a consumer that stops early releases the source, but chunks are read ahead by as much as the
 * internal buffers hold, and a source reporting the whole text at once is parsed in one go.
 *
 * Byte chunks are decoded by the task, so multibyte characters split across a chunk boundary are read correctly;
 * decoding upstream corrupts them.
 *
 * Fields are comma-separated as per RFC 4180: the delimiter isn't sniffed.
 *
 * Malformed records are skipped and reported to the log, leaving the stream to run to completion.
 *
 * @typeParam R The type of the reported records
 *
 * @param options The parsing options; every option is disabled unless enabled explicitly
 * @param options.header Enables reading the first row as column labels; records are keyed by label when enabled and
 *                       by positional index otherwise
 * @param options.skip Enables ignoring empty lines rather than reporting them as records
 * @param options.trim Enables stripping surrounding whitespace from field values
 *
 * @returns A task converting a stream of CSV text or byte chunks into a stream of records
 *
 * @throws Error To the consumer, whatever the source reports while producing chunks
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4180 RFC 4180 Common Format and MIME Type for CSV Files}
 */
export function csv<R extends Record = Record>({

	header,

	skip,
	trim

}: {

	readonly header?: boolean

	readonly skip?: boolean
	readonly trim?: boolean

} = {}): Task<string | Uint8Array, R> {

	return async function* (chunks) {

		// built per application, so nothing is read until the first record is pulled

		const parser = parse({

			columns: header === true,

			skipEmptyLines: skip === true,
			trim: trim === true,

			skipRecordsWithError: true,
			onSkip: error => void logger.warn`malformed record: ${ error?.message }`

		});

		// piped rather than handed the whole text, which would buffer every record; `pipeline()` rather than `pipe()`
		// to destroy the source on early exit and report source failures on the parser: hence the idle callback

		pipeline(Readable.from(chunks), parser, () => {});

		// delegation keeps the pull chain intact, forwarding a downstream `return()` to the parser

		yield* parser;

	};

}
