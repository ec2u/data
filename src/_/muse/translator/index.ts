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
 * Text translation.
 *
 * Provides the {@link Translator} contract for rendering text in another language, decoupling consumers from the
 * translation strategy.
 *
 * @module index
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html RFC 5646 - Tags for Identifying Languages}
 */

import type { Awaitable } from "@metreeca/core/async";
import type { Tag } from "@metreeca/core/language";
import type { Text } from "@metreeca/core/strings";


/**
 * Text translator.
 *
 * Translates text into a target language, detecting the source language when it isn't specified.
 */
export interface Translator {

	/**
	 * Translates text into a target language.
	 *
	 * @param text The text to be translated
	 * @param target The BCP 47 language {@link Tag} identifying the language `text` is to be translated into
	 * @param source The BCP 47 language {@link Tag} identifying the language `text` is written in; if undefined, the
	 * source language is detected from `text`
	 *
	 * @returns The translation of `text` into `target`, either directly or on settlement of the returned promise
	 */
	(text: Text, target: Tag, source?: Tag): Awaitable<Text>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the default translator.
 *
 * Translation depends on an external provider, with no sensible in-process fallback: a job relying on this service
 * must bind a concrete translator to it.
 *
 * @returns Nothing
 *
 * @throws {Error} Always, reporting the service as undefined
 */
export function createTranslator(): Translator {

	throw new Error("undefined text translator service");

}
