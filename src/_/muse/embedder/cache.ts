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
 * Embedding caching.
 *
 * Provides an {@link Embedder} decorator serving already embedded texts from memory, sparing consumers the latency and
 * the provider charges of embedding the same text again.
 *
 * @module
 */

import type { Awaitable } from "@metreeca/core/async";
import type { Text } from "@metreeca/core/strings";
import { dispose } from "../_disposal.js";
import type { Embedder, Vector } from "./index.js";


/**
 * Creates a caching embedder.
 *
 * Embeddings are retained in the process heap under the text they were computed from, so that a text embedded again
 * is served without a further call to the delegate, at the price of a memory footprint growing with the number of
 * distinct texts. Blank text is rejected without reaching the delegate, and a failed embedding is dropped, leaving a
 * later request free to retry.
 *
 * @param embedder The delegate embedder computing the embeddings to be retained
 *
 * @returns An embedder serving the embeddings computed by `embedder`, releasing it as the execution ends
 *
 * @throws {@link !RangeError RangeError} While embedding, if the text is blank
 *
 * @group Implementations
 */
export function createCacheEmbedder(embedder: Embedder): Embedder {

	const cache = new Map<Text, Awaitable<Vector>>();

	return Object.assign(

		(text: Text): Awaitable<Vector> => {

			if ( text.trim() === "" ) {
				throw new RangeError("expected non-blank text");
			}

			return embed(text);

		},

		{ [Symbol.asyncDispose]: () => dispose(embedder) }

	);


	function embed(text: Text): Awaitable<Vector> {

		const cached = cache.get(text);

		if ( cached === undefined ) {

			const embedding = embedder(text);

			cache.set(text, embedding);

			if ( embedding instanceof Promise ) {
				embedding.catch(() => cache.delete(text));
			}

			return embedding;

		} else {

			return cached;

		}

	}

}
