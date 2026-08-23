/*
 * Copyright © 2026 Metreeca srl
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
 * JSON parsing task.
 *
 * @module
 */

import type { Object, Value } from "@metreeca/core";
import type { Task } from "@metreeca/pipe";
import { log, report } from "@metreeca/tape";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a JSON parsing task.
 *
 * The generated task reads JSON text and byte streams as streams of values, taking the whole source as a single
 * document and reporting it as a single value.
 *
 * Chunks are pulled from the source in full before parsing, as JSON documents cannot be parsed incrementally: the
 * whole text is held in memory and nothing is reported until the source is exhausted.
 *
 * A source reporting no text is read as an empty stream.
 *
 * > [!WARNING]
 * > A document that cannot be parsed is skipped and reported to the log, leaving the stream to complete empty.
 *
 * @typeParam V The type of the reported value; the parsed document is reported as is, without being validated
 *              against it; defaults to a JSON {@link Object}
 *
 * @returns A task converting a stream of JSON text or byte chunks into a stream of values
 *
 * @throws Error While iterating the returned stream, whatever the source reports while producing chunks
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc8259 RFC 8259 JSON Data Interchange Format}
 */
export function json<V extends Value = Object>(): Task<string | Uint8Array, V> {

	return async function* (chunks) {

		// decoded chunk by chunk, so multibyte characters split across a chunk boundary are joined

		const decoder = new TextDecoder();

		const texts: string[] = [];

		for await (const chunk of chunks) { // draining a stream has no functional equivalent

			texts.push(typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true }));

		}

		yield* parse(texts.join("")+decoder.decode()); // the final flush releases bytes withheld at a boundary

	};


	function parse(text: string): readonly V[] {

		try {

			return text ? [JSON.parse(text)] : []; // yielded as parsed, without being validated against `V`

		} catch ( error ) {

			logger.warn`malformed document (${report(error)})`;

			return [];

		}

	}

}
