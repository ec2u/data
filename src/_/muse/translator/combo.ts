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
 * Translation fallback.
 *
 * Provides a {@link Translator} decorator chaining alternative providers, so that a preferred one is backed by
 * fallbacks covering the languages it doesn't handle and the failures it runs into.
 *
 * @module
 */

import type { Tag } from "@metreeca/core/language";
import type { Text } from "@metreeca/core/strings";
import { dispose } from "../_disposal.js";
import { type Translator } from "./index.js";


/**
 * Creates a combo translator.
 *
 * Delegates are tried in the order they are given and the first translation obtained is served, so that a preferred
 * provider is backed by fallbacks covering the languages it doesn't handle and the failures it runs into; a delegate
 * failing or producing an empty translation hands the request over to the next one.
 *
 * @param translators The delegate translators, in the order they are to be tried
 *
 * @returns A translator serving the first translation obtained from `translators`, releasing each of them as the
 * execution ends
 *
 * @throws {@link !Error Error} While translating, if every delegate either fails or produces an empty translation,
 * reporting the last failure as its cause
 *
 * @group Implementations
 */
export function createComboTranslator(...translators: readonly Translator[]): Translator {

	return Object.assign(
		translate,

		{ [Symbol.asyncDispose]: release }
	);


	function translate(text: Text, target: Tag, source?: Tag): Promise<Text> {

		return translators

			.reduce(
				(attempted, translator) => attempted.catch(() => attempt(translator)),

				Promise.reject<Text>(new Error("undefined translators"))
			)

			.catch(cause => {

				throw new Error(`failed translation into <${target}>`, { cause });

			});


		async function attempt(translator: Translator): Promise<Text> {

			const translation = await translator(text, target, source);

			if ( translation === "" ) {

				throw new Error(`empty translation into <${target}>`);

			} else {

				return translation;

			}

		}

	}

	function release(): Promise<void> {

		return translators.reduce(
			(pending, translator) => pending.then(() => dispose(translator)),

			Promise.resolve()
		);

	}

}
