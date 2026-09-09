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
 * Web page fetching tool for the Gemini API.
 *
 * Provides {@link fetchPage} for handing a {@link Retriever} to the model as a `fetchPage` function, so that a
 * generation may explore linked pages on its own, without the caller mediating the retrievals.
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

import { retrieve, type Retriever } from "@/_pages/index.js";
import { CallableTool, FunctionCall, Part, Tool, Type } from "@google/genai";
import { dedent } from "@metreeca/core/strings";
import { log, report } from "@metreeca/tape";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a web page fetching tool.
 *
 * Exposes a {@link Retriever} to the Gemini API as a `fetchPage` function reporting the title, markdown content and
 * outbound links of the requested page. Pages that can't be retrieved are reported as an error response rather than
 * raised, so that a failed call doesn't interrupt the generation loop; repeated requests for the same URL are
 * short-circuited only as far as the configured retriever does.
 *
 * @param options The page lookup options
 * @param options.cache The {@link Retriever} consulted for the page on every call; defaults to {@link retrieve},
 * retaining nothing, so that every request retrieves the page again
 *
 * @returns A {@link https://googleapis.github.io/js-genai/release_docs/interfaces/types.CallableTool.html
 * CallableTool} declaring the `fetchPage` function and handling the calls the model makes to it
 *
 * @see {@link https://ai.google.dev/gemini-api/docs/function-calling Function calling with the Gemini API}
 */
export function fetchPage({

	cache = retrieve

}: {

	readonly cache?: Retriever

} = {}): CallableTool {

	const name = "fetchPage" as const;

	return {

		tool: async (): Promise<Tool> => ({

			functionDeclarations: [{

				name,

				description: dedent`
					Fetches and extracts the main content from a web page.
					Returns the page title, the full text content in markdown format, and a list of
					outbound links with their URLs and anchor text. Use this function to explore pages that are
					likely to contain information about the research unit's identity, activities, topics,
					or child units.
				`,

				parameters: {
					type: Type.OBJECT,
					properties: {
						url: {
							type: Type.STRING,
							description: dedent`
								The absolute URL of the web page to fetch and extract content from
								(must start with http:// or https://)
							`
						}
					},
					required: ["url"]
				}

			}]

		}),

		callTool: async (functionCalls: FunctionCall[]): Promise<Part[]> => await Promise.all(
			functionCalls.filter(call => call.name === name).map(async (call): Promise<Part> => {

				const { url } = call.args as { url: string };

				logger.info`calling ${name}(${JSON.stringify(call.args)})`;

				try {

					const page = await cache(url);

					logger.info`fetched <${url}> (${page.content.length} chars)`;

					return {
						functionResponse: {
							name: name,
							response: page as unknown as Record<string, unknown>
						}
					};

				} catch ( error ) {

					logger.error`failed to fetch <${url}>: ${report(error)}${
						error instanceof Error && error.cause ? ` (caused by: ${report(error.cause)})` : ""
					}`;

					return {
						functionResponse: {
							name: name,
							response: { error: report(error) }
						}
					};

				}

			})
		)

	};

}
