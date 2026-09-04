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
 * Provides the {@link translate} task factory, so that a pipe renders the text it carries in another language without
 * binding itself to a translation provider.
 *
 * @module
 */

import { matchTag, type Tag } from "@metreeca/core/language";
import type { Text } from "@metreeca/core/strings";
import type { Task } from "@metreeca/flow";
import { map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { createTranslator, type Translator } from "./index.js";


/**
 * Creates a task translating text into another language.
 *
 * Each item is converted into its translation and emitted in the order items are drawn, so that prose is rendered in
 * another language as a step of a pipe rather than through a provider of its own.
 *
 * Text is handed to `using`, or to the translator resolved from the enclosing
 * {@link @metreeca/gear!index.service execution} if none is given, so that the provider is settled by the consumer
 * rather than by the task itself: binding {@link createTranslator} routes every item through a cached, chained or
 * stubbed provider, without altering the task.
 *
 * The provider is settled once, as the task is created, so the enclosing execution must already be running by then and
 * every item drawn is translated by the same provider, however long the feed runs.
 *
 * Blank text, and text whose `source` language already matches `target`, are emitted as they are, without reaching the
 * provider, so that a feed carrying text that needs no translation is neither delayed nor charged for. Languages are
 * matched under RFC 4647 basic filtering, so a regional variant counts as the language it belongs to, while text in a
 * broader language is still handed over for translation into a specific variant of it.
 *
 * > [!NOTE]
 * >
 * > - **Incremental**: each translation is emitted as soon as it is obtained, so the feed produced runs dry as the
 * >   feed drawn from does and an endless source is read as long as it is consumed.
 * > - **Streaming**: text is translated one item at a time, none retained.
 * > - **Stateless**: every item is translated on its own, so the outcome is unaffected by how the feed is split
 * >   across nested feeds or runs, whatever state the provider carries across requests.
 *
 * @param options The translation options
 * @param options.target The BCP 47 language {@link Tag} identifying the language text is to be translated into
 * @param options.source The BCP 47 language {@link Tag} identifying the language text is written in; if undefined,
 * the source language is detected by the provider
 * @param options.using The provider translating the text; if undefined, the one bound to
 * {@link createTranslator} in the enclosing execution
 *
 * @returns A task converting a feed of text into a feed of translations into `target`
 *
 * @throws {Error} If `using` is undefined and no execution is running, as the provider is resolved from the
 * enclosing one
 *
 * @throws {Error} While the feed is consumed, whatever the source reports while producing text, or whatever the
 * provider reports while translating it
 *
 * @throws {@link !TypeError TypeError} While the feed is consumed, if `source` is given and either it or `target`
 * isn't a well-formed language tag
 *
 * @group Factories
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4647.html#section-3.3.1 RFC 4647 § 3.3.1 - Basic Filtering}
 */
export function translate({

	target,
	source,

	using

}: {

	target: Tag
	source?: Tag

	using?: Translator

}): Task<Text> {

	const translator = using ?? service(createTranslator);

	return map(text => text.trim() === "" || source !== undefined && matchTag(source, target)
		? text
		: translator(text, target, source)
	);

}
