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
 * whole text is held in memory and nothing is reported until the source is exhausted; parsing requires the text as a
 * single contiguous string, so peak memory use is about twice the size of the document.
 *
 * A source reporting no text, or only whitespace, is read as an empty stream.
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

		yield* parse(await decode(chunks));

	};


	async function decode(chunks: AsyncIterable<string | Uint8Array>): Promise<string> {

		// byte chunks are decoded in streaming mode, withholding a character split across a boundary until the next
		// chunk completes it; text chunks bypass the decoder, releasing the withheld bytes first, so a sequence left
		// truncated by the switch is reported where it occurred

		const decoder = new TextDecoder();

		const texts: string[] = [];

		for await ( const chunk of chunks ) {

			texts.push(typeof chunk === "string" ? decoder.decode()+chunk : decoder.decode(chunk, { stream: true }));

		}

		return texts.join("")+decoder.decode(); // the final flush releases bytes withheld at a boundary

	}

	function parse(text: string): readonly V[] {

		try {

			return text.trim() ? [JSON.parse(text)] : [];

		} catch ( error ) {

			logger.warn`(${text.length}) malformed document (${report(error)})`;

			return [];

		}

	}

}
