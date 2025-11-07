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

import { Topic } from "@/pipelines/topics";
import { log, message } from "@/utilities/_/logger/log";
import { CallableTool, FunctionCall, Part, Tool, Type } from "@google/genai";
import dedent from "dedent";


/**
 * Topic listing tool for Gemini API.
 *
 * Creates a CallableTool that retrieves topics from a taxonomy scheme,
 * optionally filtered by focus (hierarchy descendant restriction).
 * Returns topics as an array of objects with id, label, and definition properties.
 *
 * @param opts Configuration options for topic listing
 * @param opts.topics Function that resolves a scheme URL to an array of topics
 *
 * @returns CallableTool instance for automatic function calling
 */
export function listTopics(opts: {

	topics: (scheme: string) => readonly Topic[] | Promise<readonly Topic[]>

}): CallableTool {

	const name = "listTopics" as const;

	const cache = new Map<string, Promise<readonly Topic[]>>();

	return {

		tool: async (): Promise<Tool> => ({

			functionDeclarations: [{

				name,

				description: dedent`
					Lists topics from a taxonomy scheme, optionally filtered by hierarchy focus.
					Returns an array of topic objects, each containing id, label, and definition properties.
					Use this to retrieve available typologies or other taxonomy items.
				`,

				parameters: {
					type: Type.OBJECT,
					properties: {
						scheme: {
							type: Type.STRING,
							description: "The topic scheme URL (e.g., https://data.ec2u.eu/taxonomies/organizations/)"
						},
						focus: {
							type: Type.STRING,
							description: dedent`
								Optional topic ID to restrict list to descendants
								(topics whose lineage includes this ID)
							`
						}
					},
					required: ["scheme"]
				}

			}]

		}),

		callTool: async (functionCalls: FunctionCall[]): Promise<Part[]> => await Promise.all(
			functionCalls.filter(call => call.name === name).map(async (call): Promise<Part> => {

				const {
					scheme,
					focus
				} = call.args as {
					scheme: string
					focus?: string
				};

				log.info(name, `calling ${name}(${JSON.stringify(call.args)})`);

				try {

					let topics = cache.get(scheme);

					if ( !topics ) {
						cache.set(scheme, (topics = Promise.resolve(opts.topics(scheme))));
					}

					const filtered = (await topics).filter(t => !focus || t.lineage.includes(focus));

					log.info(name, `listed ${filtered.length} topics from <${scheme}>${
						focus ? ` with focus <${focus}>` : ""
					}`);

					return {
						functionResponse: {
							name: name,
							response: {
								topics: filtered.map(topic => ({
									id: topic.id,
									label: topic.label,
									definition: topic.definition
								}))
							}
						}
					};

				} catch ( error ) {

					log.error(name, `failed to list topics: ${message(error)}`);

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
