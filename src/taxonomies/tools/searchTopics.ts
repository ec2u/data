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
 * Topic retrieval tool for the Gemini API.
 *
 * Provides {@link searchTopics} for opening a set of taxonomies to a generation as a `searchTopics` function, so that
 * a classification looks up the vocabularies itself, in its own wording and as often as the item it is working on
 * warrants.
 *
 * Candidates are handed over as they stand, labels, definitions and neighbouring topics included, and no candidate is
 * withheld on account of how far it matched: which of them applies, and whether any of them does, is left to the
 * generation, as a distance states how a text reads rather than what it is about.
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

import { getTopicMatches, type Taxonomy } from "@/taxonomies/index.js";
import { CallableTool, FunctionCall, Part, Tool, Type } from "@google/genai";
import { clip, dedent } from "@metreeca/core/strings";
import { log, report } from "@metreeca/tape";


const logger = log(import.meta.url);


/**
 * The number of candidates a call is answered with.
 *
 * Holds enough candidates for the spread of the distances to be legible, as a set standing at much the same distance
 * states that the query found nothing to tell apart, which a single closest candidate would hide; and few enough for
 * a call to stay affordable in context, as every candidate carries its labels, its definition and its neighbours. The
 * figure is settled here rather than left to the call, so that every shortlist is read against the same yardstick; a
 * vocabulary holding fewer topics is answered with all it has.
 */
const Limit = 10;

/**
 * The number of characters of a query a log line carries.
 *
 * Holds a query to what a reader takes in at a glance, as a log line is read alongside the ones around it rather than
 * on its own.
 */
const QueryLength = 60;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a topic retrieval tool.
 *
 * Opens the given taxonomies to a generation as a `searchTopics` function answering a query with the topics closest to
 * it in meaning, so that a classification draws on a controlled vocabulary rather than on wording of its own. Each
 * candidate is stated with its labels, its definition and the topics it stands under, over and beside, so that the
 * generation weighs what a topic means in the taxonomy rather than trusting the ranking. Calls that can't be served
 * are handed back as an error response rather than raised, so that a failed call doesn't interrupt the generation
 * loop.
 *
 * A call names the taxonomy it searches, and only the ones stated here can be named, so that a generation ranges over
 * the vocabularies it is entitled to and no further. No candidate is withheld on account of its distance: whether any
 * topic applies is left to the generation, which sees the whole shortlist and can state none. Every call is answered
 * with a shortlist of the same fixed length, so that one is read against the same yardstick as the next and stays
 * affordable in context however large the vocabulary searched.
 *
 * Each taxonomy is read from the store on the first call naming it and retained for the lifetime of the process, so
 * one edited afterwards is taken up by a later run.
 *
 * @param taxonomies The taxonomies a call may name; a call naming anything else is answered with an error
 *
 * @returns A {@link https://googleapis.github.io/js-genai/release_docs/interfaces/types.CallableTool.html
 * CallableTool} declaring the `searchTopics` function and handling the calls the model makes to it
 *
 * @throws {@link !RangeError RangeError} If `taxonomies` is empty, as a generation would have nothing to search
 *
 * @see {@link https://ai.google.dev/gemini-api/docs/function-calling Function calling with the Gemini API}
 */
export function searchTopics(taxonomies: readonly Taxonomy[]): CallableTool {

	if ( taxonomies.length === 0 ) {
		throw new RangeError("expected non-empty taxonomies");
	}

	const name = "searchTopics";

	return {

		tool: async (): Promise<Tool> => ({

			functionDeclarations: [{

				name,

				description: dedent`
					Searches a controlled vocabulary for the topics closest in meaning to a query, ordered by increasing
					distance (closest first). Topics are SKOS concepts, each stating its id, prefLabel, altLabel,
					definition, and the concepts it stands under (broader), over (narrower) and beside (related),
					every one of them named with its own prefLabel.

					Distances are relative, not absolute: they say how the candidates compare to one another, not
					whether any of them applies. Where the candidates returned stand at much the same distance, the
					query has found nothing to tell apart and the vocabulary likely says nothing about the item.
					Nothing is filtered out beforehand: judge the candidates on their labels and definitions, call
					again with a different wording where none fits, and state no topic at all where none applies.

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
							description: "The identifier of the vocabulary to search"
						},
						query: {
							type: Type.STRING,
							description: dedent`
								The text to match topics against; phrase it as the aspect of the item being classified
								that this vocabulary covers, rather than pasting the item wholesale
							`
						}
					},
					required: ["taxonomy", "query"]
				}

			}]

		}),

		callTool: async (functionCalls: FunctionCall[]): Promise<Part[]> => {

			return await Promise.all(
				functionCalls.filter(call => call.name === name).map(async (call): Promise<Part> => {

					const { taxonomy, query } = call.args as { // ;(cast) model arguments, unvalidated by the SDK

						taxonomy: string
						query: string

					};

					logger.info`searching <${taxonomy}> for <${clip(query, QueryLength)}>`;

					try {

						const searched = taxonomies.find(({ id }) => id === taxonomy);

						if ( searched === undefined ) {

							throw new RangeError(`unknown taxonomy <${taxonomy}>`);

						} else {

							const matches = (await getTopicMatches(searched, query)).slice(0, Limit);

							const closest = matches[0];

							logger.info`matched <${matches.length}> topics for <${clip(query, QueryLength)}>${
								closest === undefined ? "" : `, closest <${closest.prefLabel}> at <${
									closest.distance.toFixed(3)
								}>`
							}`;

							return {
								functionResponse: {
									name,
									response: { matches }
								}
							};

						}

					} catch ( error ) {

						logger.error`failed to search topics: ${report(error)}`;

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
