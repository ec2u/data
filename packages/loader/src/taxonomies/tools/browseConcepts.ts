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
 * Concept navigation tool for the Gemini API.
 *
 * Provides {@link browseConcepts} for opening a set of taxonomies to a generation as a `browseConcepts` function, so
 * that a classification reads a vocabulary as it is organised rather than only as it is worded.
 *
 * Navigation is the companion of {@link searchConcepts search}: a search states which concepts read like the item at
 * hand, while browsing states what else stands beside them and what they fall under, so that a generation confirms it
 * is reading a label the way the taxonomy means it, reaches a sibling no wording would have found, and falls back on a
 * broader concept where every specific one fits poorly. A vocabulary is walked one level at a time and is never handed
 * over whole, so that a large one doesn't swamp the context it is read in.
 *
 * The tool is packaged as a
 * {@link https://googleapis.github.io/js-genai/release_docs/interfaces/types.CallableTool.html CallableTool}, the
 * `@google/genai` interface bundling the tool declaration (`tool()`) with its execution logic (`callTool()`), so that
 * the SDK runs the function calling loop by itself rather than leaving the caller to handle the calls the model makes.
 *
 * > [!IMPORTANT]
 * > A generation configured with callable tools can't also declare plain tools: the SDK rejects the combination.
 *
 * @see {@link https://googleapis.github.io/js-genai/release_docs/interfaces/types.CallableTool.html
 * Official CallableTool Documentation}
 * @see {@link https://ai.google.dev/gemini-api/docs/function-calling Standard Function Calling Guide}
 *
 * @module
 */

import type { Taxonomy } from "@ec2u/data-shared/taxonomies/index.js";
import { dedent } from "@grafctory/core/strings";
import { CallableTool, FunctionCall, Part, Tool, Type } from "@grafctory/llms-google";
import { log, report } from "@grafctory/tape";
import { getConceptEntries } from "../index.core.js";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a concept navigation tool.
 *
 * Opens the given taxonomies to a generation as a `browseConcepts` function answering with the concepts of a vocabulary
 * as it is organised: the ones standing at its top, or the ones it names, each stated with its labels, its definition
 * and the concepts it stands under, over and beside. Naming the concepts a previous answer stated as narrower descends
 * one level, so that a generation reaches what it needs without the vocabulary ever being handed over whole. Calls that
 * can't be served are handed back as an error response rather than raised, so that a failed call doesn't interrupt the
 * generation loop.
 *
 * A call names the taxonomy it walks, and only the ones stated here can be named, so that a generation ranges over the
 * vocabularies it is entitled to and no further.
 *
 * Each taxonomy is read from the store on the first call naming it and retained for the lifetime of the process, so
 * one edited afterwards is taken up by a later run.
 *
 * @param taxonomies The taxonomies a call may name; a call naming anything else is answered with an error
 *
 * @returns A {@link https://googleapis.github.io/js-genai/release_docs/interfaces/types.CallableTool.html
 * CallableTool} declaring the `browseConcepts` function and handling the calls the model makes to it
 *
 * @throws {@link !RangeError RangeError} If no taxonomy is stated, as a generation would have nothing to walk
 *
 * @see {@link https://ai.google.dev/gemini-api/docs/function-calling Function calling with the Gemini API}
 */
export function browseConcepts(...taxonomies: readonly Taxonomy[]): CallableTool {

	if ( taxonomies.length === 0 ) {
		throw new RangeError("expected non-empty taxonomies");
	}

	const name = "browseConcepts";

	return {

		tool: async (): Promise<Tool> => ({

			functionDeclarations: [{

				name,

				description: dedent`
					Walks a controlled vocabulary as it is organised. Called with a vocabulary alone, it returns the
					concepts standing at its top; called with concepts as well, it returns the record of each of them.
					These are SKOS concepts, each stating its id, prefLabel, altLabel, definition, and the concepts it
					stands under (broader), over (narrower) and beside (related), every one of them named with its own
					prefLabel.

					Use it to see what a candidate concept is distinguished from, and to fall back on a broader concept
					where the specific ones under it all fit poorly. A vocabulary is reached level by level and is never
					returned whole: a record names the concepts standing under it, and naming those in a further call
					descends one more level.

					Available vocabularies:

					${taxonomies.map(({ id, label }) => `- ${id} — ${label}`).join("\n")}
				`,

				parameters: {
					type: Type.OBJECT,
					properties: {
						taxonomy: {
							type: Type.STRING,
							format: "enum",
							enum: taxonomies.map(({ id }) => id),
							description: "The identifier of the vocabulary to walk"
						},
						concepts: {
							type: Type.ARRAY,
							items: { type: Type.STRING },
							description: dedent`
								Optional identifiers of the concepts to read, exactly as a previous call stated them; if
								omitted, the concepts standing at the top of the vocabulary are returned
							`
						}
					},
					required: ["taxonomy"]
				}

			}]

		}),

		callTool: async (functionCalls: FunctionCall[]): Promise<Part[]> => {

			return await Promise.all(
				functionCalls.filter(call => call.name === name).map(async (call): Promise<Part> => {

					const { taxonomy, concepts: requested } = call.args as { // ;(cast) model arguments, unvalidated by the SDK

						taxonomy: string
						concepts?: readonly string[]

					};

					// the taxonomy is fixed for the tool and the concepts stand under it, so only what sets the call
					// apart from the others is stated

					logger.info`browsing ${requested?.map(id => id.replace(`${taxonomy}/`, "")).join(", ")
					?? "top concepts"}`;

					try {

						const browsed = taxonomies.find(({ id }) => id === taxonomy);

						if ( browsed === undefined ) {

							throw new RangeError(`unknown taxonomy <${taxonomy}>`);

						} else {

							const concepts = await getConceptEntries(browsed, requested);

							const unknown = (requested ?? []).filter(id => !concepts.some(concept => concept.id === id));

							if ( unknown.length > 0 ) {

								throw new RangeError(`unknown concepts <${unknown.join(">, <")}>`);

							} else {

								logger.info`browsed ${concepts.length} concepts of <${taxonomy}>`;

								return {
									functionResponse: {
										name,
										response: { concepts }
									}
								};

							}

						}

					} catch ( error ) {

						logger.error`failed to browse concepts: ${report(error)}`;

						return {
							functionResponse: {
								name,
								response: { error: report(error) }
							}
						};

					}

				})
			);

		}

	};

}
