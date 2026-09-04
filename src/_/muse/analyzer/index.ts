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
 * Text analysis.
 *
 * Provides the {@link Analyzer} contract for extracting structured information from text under a plain language
 * prompt, decoupling consumers from the analysis strategy.
 *
 * @module index
 *
 * @see {@link https://json-schema.org/ JSON Schema}
 */

import type { Optional, Value } from "@metreeca/core";
import type { Awaitable } from "@metreeca/core/async";
import type { Text } from "@metreeca/core/strings";


/**
 * Text analyser.
 *
 * Extracts structured information from text as directed by a plain language prompt.
 */
export interface Analyzer {

	/**
	 * Analyses a text.
	 *
	 * @param text The text to be analysed
	 *
	 * @returns The information extracted from `text`, either directly or on settlement of the returned promise, or
	 * undefined if the text carries none of the expected information
	 */
	(text: Text): Awaitable<Optional<Value>>;

	/**
	 * Configures the information to be extracted.
	 *
	 * @param prompt The plain language description of the information to be extracted
	 * @param schema The JSON Schema the extracted information is expected to conform to; if undefined, the shape of
	 * the extracted information is left to `prompt`
	 *
	 * @returns An analyser extracting from text the information described by `prompt`
	 */
	prompt(prompt: Text, schema?: Value): Analyzer;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the default analyser.
 *
 * Analysis depends on an external provider, with no sensible in-process fallback: a job relying on this service must
 * bind a concrete analyser to it.
 *
 * @returns Nothing
 *
 * @throws {Error} Always, reporting the service as undefined
 */
export function createAnalyzer(): Analyzer {

	throw new Error("undefined text analyzer service");

}
