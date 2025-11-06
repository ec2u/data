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

import { message } from "@/utilities/core/log";
import { md } from "@/utilities/core/tags";
import { withRetry } from "@/utilities/gcp/_retry";
import { secret } from "@/utilities/gcp/secrets";
import { Content, EmbedContentResponse, GenerateContentResponse, GoogleGenAI, Part } from "@google/genai";


export const ai = await (async (ai) => {
	return Object.assign(ai, { // patch to work around known issues

		models: Object.assign(ai.models, {

			generateContent: (generateContent => {

				return async (...[{ config, ...params }, ...rest]: Parameters<typeof generateContent>) => {

					return config?.tools
						? await structure(await execute())
						: await generateContent(params, ...rest);


					/**
					 * Executes generateContent with automatic function calling when tools are configured.
					 *
					 * The SDK's built-in automatic function calling (AFC) loop does not throttle requests
					 * against quota limits and provides no recovery mechanism for quota exhaustion. This causes
					 * unexpected 429 errors during long sessions with tools, as documented in other SDK
					 * implementations:
					 *
					 * - googleapis/python-genai#17: 429 errors with Google Search tool
					 * - google/adk-python#1057: 1.5M tokens in ~20 requests with Browser MCP (tools send
					 *   entire DOM as context)
					 *
					 * Function declarations count toward token limits, and automatic function calling triggers
					 * multiple API requests per generateContent() call. Certain tools (Browser MCP, Google
					 * Search) send massive contexts on every turn. To handle these issues, manual AFC loop
					 * implementation with proper throttling and recovery is required.
					 *
					 * @returns The model response with function calls handled via manual function calling loop
					 */
					async function execute(): Promise<GenerateContentResponse> {

						const {

							tools,
							automaticFunctionCalling,

							responseSchema,
							responseMimeType,

							...configWithoutSchema

						} = config ?? {};

						if ( automaticFunctionCalling?.disable ) {

							return await generateContent({ ...params, config: configWithoutSchema }, ...rest);

						} else {

							// Manual function calling loop with quota throttling
							const maximumRemoteCalls = automaticFunctionCalling?.maximumRemoteCalls ?? 100;

							// Extract CallableTool instances if present
							const callableTools = tools?.filter((tool): tool is {
									tool: () => Promise<any>;
									callTool: (calls: any[]) => Promise<Part[]>
								} =>
									typeof tool === "object" && "callTool" in tool
									&& typeof tool.callTool === "function"
							) ?? [];

							// Get tool declarations from CallableTool instances if present, otherwise use tools as-is
							const toolDeclarations = callableTools.length > 0
								? await Promise.all(callableTools.map(t => t.tool()))
								: tools;

							// Initialize conversation history from initial contents
							const normalizeContent = (c: any): Content => {
								if ( typeof c === "string" ) {
									return { role: "user" as const, parts: [{ text: c }] };
								}
								if ( "role" in c ) {
									return c as Content;
								}
								// Single Part object, wrap it as user content
								return { role: "user" as const, parts: [c] };
							};

							const conversationHistory: Content[] = Array.isArray(params.contents)
								? params.contents.map(normalizeContent)
								: [normalizeContent(params.contents)];

							let turnCount = 0;

							while ( turnCount < maximumRemoteCalls ) {
								turnCount++;

								// Call API with retry logic - conversationHistory preserved across retries
								const response = await withRetry(
									() => generateContent({
										...params,
										contents: conversationHistory,
										config: { ...configWithoutSchema, tools: toolDeclarations }
									}, ...rest),
									{ name: `generateContent(turn ${turnCount})` }
								);

								// Add model's response to conversation history
								const modelContent = response.candidates?.[0]?.content;
								if ( !modelContent ) {
									throw new Error("no model content in response");
								}

								conversationHistory.push(modelContent);

								// Check if model wants to call functions
								const functionCalls = modelContent.parts?.filter(part => part.functionCall);

								if ( functionCalls && functionCalls.length > 0 ) {

									// Execute function calls using CallableTool interface if available
									if ( callableTools.length > 0 ) {

										const allResults: Part[] = [];

										for (const tool of callableTools) {
											const results = await tool.callTool(
												functionCalls.map(fc => fc.functionCall!).filter(Boolean)
											);
											allResults.push(...results);
										}

										// Add function responses to history as user message
										conversationHistory.push({
											role: "user",
											parts: allResults
										});

									} else {

										// No CallableTool implementations - cannot execute functions
										throw new Error([
											"model requested function calls",
											"but no CallableTool implementations provided"
										].join(" "));

									}

									// Continue loop - model will process function results in next turn

								} else {

									// Model provided final response without function calls
									// Add automaticFunctionCallingHistory to mimic SDK behavior
									return Object.assign(response, {
										automaticFunctionCallingHistory: conversationHistory.slice(
											0,
											conversationHistory.length-1
										) // Exclude the final model response
									});

								}
							}

							throw new Error(`maximum turns (${maximumRemoteCalls}) reached without completion`);

						}

					}

					/**
					 * Post-processes the response to structured JSON if requested and response is final.
					 *
					 * The Gemini API rejects requests combining tools with `responseMimeType` "application/json":
					 * this function works around the limitation by applying structured output conversion via a
					 * separate model call after the initial model completes function calls and returns its final
					 * textual response.
					 *
					 * @param response - The model response to post-process
					 *
					 * @returns The response as-is if no schema requested or response contains function calls
					 *          (intermediate response awaiting tool execution); otherwise, returns response with
					 *          candidates replaced by structured JSON via separate model call.
					 *
					 * @see {@link https://github.com/googleapis/js-genai/issues/727}
					 */
					async function structure(response: GenerateContentResponse) {

						const responseSchema = config?.responseSchema;

						const hasFunctionCalls = response.candidates?.[0]?.content?.parts?.some(
							part => part.functionCall
						);

						if ( !responseSchema || hasFunctionCalls ) {

							return response;

						} else {

							const input = text(response);

							if ( !input || !input.trim() ) {
								throw new Error("empty model response: unable to extract structured data");
							}

							const urls = [...new Set(input.match(/https?:\/\/[^\s\[\]()<>]+/g) || [])];

							const data = await generateContent({
								model: "gemini-2.5-flash-lite",
								contents: [input, urls.length > 0
									? md`REFERENCE URLs found in source (use EXACTLY as written):
											${urls.map(url => `- ${url}`).join("\n")}
									`
									: "REFERENCE URLs found in source: (none identified)"
								],
								config: {
									seed: 0,
									temperature: 0,
									systemInstruction: md`
									
										# ROLE
										
										You are a data engineer.
										
										# INPUT
										
										You will be provided with a textual report and a reference list of URLs
										extracted from it.
										
										# GOAL
										
										Your task is to convert it into a structured machine-readable representation.
										
										# OUTPUT
										
										Reply with a structured JSON object; unless otherwise required by the
										provided schema:

										- ALWAYS omit undefined scalar values
										- ALWAYS omit empty object values
										- ALWAYS omit empty array values
										- ALWAYS omit fields with value "Not defined" or similar placeholder text
										- ALWAYS omit fields with error messages or system artifacts

										# CRITICAL
										
										When including URLs in the output:
										
										- ALWAYS copy-paste them EXACTLY from the REFERENCE URLs list
										- NEVER modify domain names (e.g., 'ec2u' must remain 'ec2u', NOT 'ec22')
										- NEVER modify path components
										
									`,
									responseMimeType: "application/json",
									responseSchema
								}
							});

							return {
								...response,
								candidates: data.candidates
							};

						}
					}


				};

			})(ai.models.generateContent.bind(ai.models))

		})

	});

})(new GoogleGenAI({

	apiKey: await secret("googleai-key")

}));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Extracts and validates text content from a Gemini API response.
 *
 * Filters out non-text parts (thinking, function calls, etc.) to extract only output text.
 * Validates response completeness when automatic function calling is used.
 *
 * @param response Response from a generateContent call
 *
 * @returns Trimmed text content from the final response
 *
 * @throws Error if response validation fails or contains no output text
 */
export function text(response: GenerateContentResponse): string {
	return (validate(response).candidates?.[0]?.content?.parts ?? [])
		.filter(part => part.text && !part.thought)
		.map(part => part.text)
		.join("\n\n")
		.trim();
}

/**
 * Extracts and parses JSON content from a Gemini API response.
 *
 * @param response Response from a generateContent call with JSON output
 *
 * @returns Parsed JSON object
 *
 * @throws Error if response validation fails, contains no output text, or has invalid JSON
 */
export function json<T>(response: GenerateContentResponse): T {
	try {

		return JSON.parse(text(response));

	} catch ( e ) {
		throw new Error(`malformed model response: ${message(e)}`);
	}
}

/**
 * Extracts embedding vector from a Gemini API response.
 *
 * @param response Response from an embedContent call
 *
 * @returns Embedding vector as an array of numbers, or empty array if not present
 */
export function embedding(response: EmbedContentResponse) {
	return response.embeddings?.[0]?.values ?? [];
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Validates a Gemini API response for completeness and correctness.
 *
 * When automatic function calling is enabled, checks if the final response contains output text.
 * A complete response should have text in candidates[0].content.parts after function calling completes.
 * If the final response has no output text, this indicates the generation was interrupted or incomplete.
 *
 * @param response Response from a generateContent call
 *
 * @returns The same response (pass-through for chaining)
 *
 * @throws Error if validation fails (incomplete results, corrupted response, etc.)
 */
function validate(response: GenerateContentResponse): GenerateContentResponse {

	const history = response.automaticFunctionCallingHistory;

	if ( history && history.length > 0 ) {

		// Check if the final response (not history) contains output text

		const finalParts = response.candidates?.[0]?.content?.parts ?? [];
		const hasOutputText = finalParts.some(part => part.text && !part.thought);

		if ( !hasOutputText ) {

			const functionCallTurns = history.filter(msg =>
				msg.role === "model" && msg.parts?.some(part => part.functionCall)
			).length;

			throw new Error(
				`generation incomplete with no output text after ${functionCallTurns} function calling turn(s)`
			);
		}
	}

	return response;
}
