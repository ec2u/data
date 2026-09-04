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
 * Translation caching.
 *
 * Provides a {@link Translator} decorator serving already translated requests from memory, sparing consumers the
 * latency and the provider charges of translating the same text again.
 *
 * @module
 */

import type { Awaitable } from "@metreeca/core/async";
import type { Tag } from "@metreeca/core/language";
import type { Text } from "@metreeca/core/strings";
import { dispose } from "../_disposal.js";
import { translatable, type Translator } from "./index.js";


/**
 * Creates a caching translator.
 *
 * Translations are retained in the process heap under the text and the languages they were requested for, so that the
 * same request is served without a further call to the delegate, at the price of a memory footprint growing with the
 * number of distinct requests. Blank text is served as it is, without reaching the delegate, and a failed translation
 * is dropped, leaving a later request free to retry.
 *
 * @param translator The delegate translator producing the translations to be retained
 *
 * @returns A translator serving the translations produced by `translator`, releasing it as the execution ends
 *
 * @group Implementations
 */
export function createCacheTranslator(translator: Translator): Translator {

	const cache = new Map<string, Awaitable<Text>>();

	return Object.assign(

		(text: Text, target: Tag, source?: Tag): Awaitable<Text> => translatable(text, target, source)
			? translate(text, target, source)
			: text,

		{ [Symbol.asyncDispose]: () => dispose(translator) }

	);


	function translate(text: Text, target: Tag, source?: Tag): Awaitable<Text> {

		const key = JSON.stringify([text, target, source]);

		const cached = cache.get(key);

		if ( cached !== undefined ) {

			return cached;

		} else {

			const translation = translator(text, target, source);

			cache.set(key, translation);

			if ( translation instanceof Promise ) {
				translation.catch(() => cache.delete(key));
			}

			return translation;

		}

	}

}
