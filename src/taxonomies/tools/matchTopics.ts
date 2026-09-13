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
 * Topic matching tool for the Gemini API.
 *
 * Provides {@link matchTopics} for handing a taxonomy to the model as a `matchTopics` function, so that a generation
 * classifies whatever text it is working on against a controlled vocabulary on its own, without the caller mediating
 * the matching.
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

import { createEmbedder, type Index } from "@/_/muse/embedder/index.js";
import type { TreeIndexOpts } from "@/_/muse/embedder/tree.js";
import { getTaxonomyIndex } from "@/taxonomies/index.js";
import { CallableTool, FunctionCall, Part, Tool, Type } from "@google/genai";
import { dedent } from "@metreeca/core/strings";
import { service } from "@metreeca/gear";
import type { Reference } from "@metreeca/qest/resource";
import { log, report } from "@metreeca/tape";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a topic matching tool.
 *
 * Exposes a taxonomy to the Gemini API as a `matchTopics` function answering a text with the identifiers of the topics
 * it stands closest to in meaning, each alongside the distance it was matched at, so that a generation states a
 * classification drawn from the taxonomy rather than one of its own wording. Calls that can't be served are handed back
 * as an error response rather than raised, so that a failed call doesn't interrupt the generation loop.
 *
 * The taxonomy and the bounds are settled here and hold for every call, so that a generation states what it is
 * classifying and nothing about how the classification is bounded. The taxonomy is read from the store on the first
 * call and held for the life of the tool, so one edited afterwards calls for a tool of its own.
 *
 * @param taxonomy The identifier of the taxonomy topics are matched against
 * @param options The {@link TreeIndexOpts} bounds every call is held to; if undefined, calls are bounded only by the
 * limit they state
 *
 * @returns A {@link https://googleapis.github.io/js-genai/release_docs/interfaces/types.CallableTool.html
 * CallableTool} declaring the `matchTopics` function and handling the calls the model makes to it
 *
 * @see {@link https://ai.google.dev/gemini-api/docs/function-calling Function calling with the Gemini API}
 */
export function matchTopics(taxonomy: Reference, options: TreeIndexOpts<Reference> = {}): CallableTool {

	const name = "matchTopics";

	// the store is resolved from the enclosing execution, which the tool is created outside of, so the taxonomy is read
	// on the first call and retained rather than reread at each one

	let index: undefined | Promise<Index<Reference>>; // ;(let) memoised on first use

	return {

		tool: async (): Promise<Tool> => ({

			functionDeclarations: [{

				name,

				description: dedent`
					Matches topics of a taxonomy against a text query by semantic similarity.
					Returns an array of matching topics ordered by increasing distance (most relevant first), each
					stating the topic id and the distance it was matched at (lower is better). The taxonomy searched and
					the bounds matches are accepted under are fixed: the query text and the number of matches wanted are
					the only things to state.
				`,

				parameters: {
					type: Type.OBJECT,
					properties: {
						text: {
							type: Type.STRING,
							description: "The query text to match against topics"
						},
						limit: {
							type: Type.INTEGER,
							description: dedent`
								Optional maximum number of matches to return (must be greater than 0);
								if omitted, the closest topic alone is returned
							`
						}
					},
					required: ["text"]
				}

			}]

		}),

		callTool: async (functionCalls: FunctionCall[]): Promise<Part[]> => {

			const embedder = service(createEmbedder);

			return await Promise.all(
				functionCalls.filter(call => call.name === name).map(async (call): Promise<Part> => {

					const { text, limit = 1 } = call.args as { // ;(cast) unvalidated SDK boundary, as the model states the arguments

						text: string
						limit?: number

					};

					logger.info`calling ${name}(${JSON.stringify(call.args)})`;

					try {

						const matches = (await (index ??= getTaxonomyIndex(taxonomy, options)))(
							await embedder(text), limit
						);

						logger.info`matched ${matches.length} topics for query <${text}> ${
							JSON.stringify(matches.map(([id]) => id))
						}`;

						return {
							functionResponse: {
								name,
								response: {
									matches: matches.map(([id, distance]) => ({ id, distance }))
								}
							}
						};

					} catch ( error ) {

						logger.error`failed to match topics: ${report(error)}`;

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
