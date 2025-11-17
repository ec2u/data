/*
 * Copyright © 2020-2025 EC2U Alliance
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

import { match, Topic } from "@/pipelines/topics";
import { CallableTool, FunctionCall, Part, Tool, Type } from "@google/genai";

import { log, message } from "@metreeca/core/logger";
import dedent from "dedent";


const logger = log(import.meta.url);

/**
 * Topic matching tool for Gemini API.
 *
 * Creates a CallableTool that matches topics against text queries using semantic similarity,
 * with support for filtering, thresholding, and hierarchical adjustments.
 *
 * @param opts Configuration options for topic matching
 * @param opts.topics Function that resolves a scheme URL to an array of topics
 *
 * @returns CallableTool instance for automatic function calling
 */
export function matchTopics(opts: {

	topics: (scheme: string) => readonly Topic[] | Promise<readonly Topic[]>

}): CallableTool {

	const name = "matchTopics" as const;

	const cache = new Map<string, Promise<readonly Topic[]>>();

	return {

		tool: async (): Promise<Tool> => ({

			functionDeclarations: [{

				name,

				description: dedent`
					Matches topics against a text query using semantic similarity based on cosine distance.
					Returns an array of matching topics ordered by increasing distance (most relevant first),
					with each topic containing its id, label, and definition properties.
					Supports optional filtering by hierarchy focus, distance threshold, tolerance from best match,
					and depth-based narrowing adjustment.
				`,

				parameters: {
					type: Type.OBJECT,
					properties: {
						text: {
							type: Type.STRING,
							description: "The query text to match against topics"
						},
						scheme: {
							type: Type.STRING,
							description: "The topic scheme URL (e.g., https://data.ec2u.eu/taxonomies/organizations/)"
						},
						focus: {
							type: Type.STRING,
							description: dedent`
								Optional topic ID to restrict matches to descendants
								(topics whose lineage includes this ID)
							`
						},
						limit: {
							type: Type.INTEGER,
							description: "Optional maximum number of matches to return (must be non-negative)"
						},
						threshold: {
							type: Type.NUMBER,
							description: dedent`
								Optional maximum distance threshold (must be non-negative);
								topics with distance exceeding this value are excluded
							`
						},
						tolerance: {
							type: Type.NUMBER,
							description: dedent`
								Optional relative tolerance from the best match (must be non-negative);
								filters results within best + max(1-best, 0) * tolerance
							`
						},
						narrowing: {
							type: Type.NUMBER,
							description: dedent`
								Optional depth adjustment factor (must be non-negative);
								multiplies distance by narrowing^depth where depth is lineage.length - 1.
								Values > 1 penalize deeper topics; values < 1 favor them.
							`
						}
					},
					required: ["text", "scheme"]
				}

			}]

		}),

		callTool: async (functionCalls: FunctionCall[]): Promise<Part[]> => await Promise.all(
			functionCalls.filter(call => call.name === name).map(async (call): Promise<Part> => {

				const {
					text,
					scheme,
					focus,
					limit,
					threshold,
					tolerance,
					narrowing
				} = call.args as {
					text: string
					scheme: string
					focus?: string
					limit?: number
					threshold?: number
					tolerance?: number
					narrowing?: number
				};

				logger.info`calling ${name}(${JSON.stringify(call.args)})`;

				try {

					let topics = cache.get(scheme);

					if ( !topics ) {
						cache.set(scheme, (topics = Promise.resolve(opts.topics(scheme))));
					}

					const matches = await match(text, {
						topics: await topics,
						focus,
						limit,
						threshold,
						tolerance,
						narrowing
					});

					logger.info`matched ${matches.length} topics for query <${text}> ${
						JSON.stringify(matches.map(t => t.id))
					}`;

					return {
						functionResponse: {
							name: name,
							response: {
								matches: matches.map(topic => ({
									id: topic.id,
									label: topic.label,
									definition: topic.definition
								}))
							}
						}
					};

				} catch ( error ) {

					logger.error`failed to match topics: ${message(error)}`;

					return {
						functionResponse: {
							name: name,
							response: { error: message(error) }
						}
					};

				}

			})
		)

	};

}
