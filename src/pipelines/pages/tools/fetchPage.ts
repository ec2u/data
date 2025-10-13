/*
 * Copyright © 2025 Metreeca srl
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

import { visit } from "@/pipelines/pages";
import { log, message } from "@/utilities/core/log";
import { CallableTool, FunctionCall, Part, Tool, Type } from "@google/genai";
import dedent from "dedent";

/**
 * @module
 *
 * Gemini API tools using the CallableTool interface.
 *
 * This module implements tools for the Gemini API using the
 * {@link https://googleapis.github.io/js-genai/release_docs/interfaces/types.CallableTool.html CallableTool}
 * interface from the `@google/genai` SDK (v1.22.0+).
 *
 * ## CallableTool Interface
 *
 * `CallableTool` is an official SDK interface for automatic function calling that bundles both tool declaration
 * (`tool()` method) and execution logic (`callTool()` method). Unlike the standard function calling approach
 *     documented
 * at {@link https://ai.google.dev/gemini-api/docs/function-calling ai.google.dev/gemini-api/docs/function-calling},
 * which requires manual handling of function calls, `CallableTool` enables the SDK to automatically execute functions
 * when the model requests them.
 *
 * ### Automatic Function Calling Flow
 *
 * When using `CallableTool`, the SDK handles the complete function calling loop:
 *
 * 1. Model generates response with function calls
 * 2. SDK detects `functionCalls` in response
 * 3. SDK invokes `callTool()` on all CallableTool instances with all function calls
 * 4. Tools filter and process their matching calls, returning `Part[]` with function responses
 * 5. SDK appends function responses to conversation with `role: "user"`
 * 6. SDK continues generation with updated context
 * 7. Loop repeats until model stops calling functions or max rounds reached (default: 10)
 *
 * ### Key Characteristics
 *
 * - **Batch execution**: All `CallableTool` instances receive all function calls; each tool filters for its own calls
 * - **Automatic looping**: SDK manages multi-turn function calling without manual intervention
 * - **Response role**: Function responses are added with `role: "user"` (not `"function"`)
 * - **Error handling**: SDK throws errors for unknown functions; tools should handle execution errors gracefully
 * - **History tracking**: Optional `automaticFunctionCallingHistory` contains full conversation
 * - **Exclusive mode**: Cannot mix `CallableTool` with regular `Tool` objects (throws "Automatic function calling with
 *   CallableTools and Tools is not yet supported")
 *
 * ### Implementation Notes
 *
 * Feature introduced in SDK v1.11.0 (July 23, 2025) via
 * {@link https://github.com/googleapis/js-genai/pull/807 PR #807}, expanding automatic function calling beyond MCP
 * clients to any `CallableTool` implementation.
 *
 * @see {@link https://googleapis.github.io/js-genai/release_docs/interfaces/types.CallableTool.html
 * Official CallableTool Documentation}
 * @see {@link https://github.com/googleapis/js-genai/pull/807 PR #807 - Enable CallableTool AFC}
 * @see {@link https://ai.google.dev/gemini-api/docs/function-calling Standard Function Calling Guide}
 */

/**
 * Web page fetching tool for Gemini API.
 *
 * Creates a CallableTool that fetches and extracts content from web pages, maintaining a visited URL cache to prevent
 * duplicate requests within the same tool instance.
 *
 * @param opts Visit options including cache configuration for page content
 *
 * @returns CallableTool instance for automatic function calling
 */
export function fetchPage(opts: Parameters<typeof visit>[1]={}): CallableTool {

	const name="fetchPage" as const;

	const visited=new Set<string>();

	return {

		tool: async (): Promise<Tool> => ({

			functionDeclarations: [{

				name,

				description: dedent`
					Fetches and extracts the main content from a web page.
					Returns the page title, a summary, the full text content in markdown format, and a list of
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

				const { url }=call.args as { url: string };

				log.info(name, `calling ${name}(${JSON.stringify(call.args)})`);

				if ( visited.has(url) ) {

					log.warn(name, `previously visited URL <${url}>`);

					return {
						functionResponse: {
							name: name,
							response: { error: `previously visited URL <${url}>` }
						}
					};

				} else {

					visited.add(url);

					try {

						const page=await visit(url, opts);

						log.info(name, `fetched <${url}> (${page.content.length} chars)`);

						return {
							functionResponse: {
								name: name,
								response: page as unknown as Record<string, unknown>
							}
						};

					} catch ( error ) {

						log.error(name, `failed to fetch <${url}>: ${message(error)}`);

						return {
							functionResponse: {
								name: name,
								response: { error: message(error) }
							}
						};

					}

				}

			})
		)

	};

}
