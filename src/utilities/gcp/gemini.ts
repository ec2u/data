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

import { Throttle } from "@/utilities/_/async/throttle";
import { log } from "@/utilities/_/logger";
import { message } from "@/utilities/_/logger/log";
import { md } from "@/utilities/core/tags";
import { secret } from "@/utilities/gcp/secrets";
import {
	ApiError,
	CallableTool,
	Content,
	EmbedContentResponse,
	GenerateContentResponse,
	GoogleGenAI,
	Part
} from "@google/genai";
import { isString } from "@metreeca/core";


const logger = log(import.meta.url);


export const ai = await (async (ai) => {

	/**
	 * Shared throttles by model name for rate limiting API requests.
	 */
	const throttles = new Map<string, ReturnType<typeof Throttle>>();


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

						if ( automaticFunctionCalling?.disable ) { // caller will handle function calling

							return await generateContent({ ...params, config: configWithoutSchema }, ...rest);

						}

						// automatic function calling loop with quota throttling

						const maximumRemoteCalls = automaticFunctionCalling?.maximumRemoteCalls ?? 100;

						const callableTools = tools?.filter((tool: any): tool is CallableTool =>
							typeof tool === "object" && "callTool" in tool
							&& typeof tool.callTool === "function"
						) ?? [];

						function normalizeContent(content: string | Content | Part): Content {

							return isString(content) ? { role: "user", parts: [{ text: content }] }
								: "role" in content && "parts" in content ? content
									: { role: "user", parts: [content as Part] };

						}

						const conversationHistory: Content[] = Array.isArray(params.contents)
							? params.contents.map(normalizeContent)
							: [normalizeContent(params.contents)];

						const throttle = throttles.get(params.model) ?? throttles.set(params.model, Throttle({
							minimum: 100,
							maximum: 60*1000,
							buildup: 1.10,
							backoff: 1.10,
							recover: 0.95
						})).get(params.model)!;

						return await functionCallingLoop();


						async function functionCallingLoop() {

							for (let turn = 1; turn <= maximumRemoteCalls; turn++) {

								const response = await callModel();

								const modelContent = response.candidates?.[0]?.content;

								if ( !modelContent ) {
									throw new Error("no model content in response");
								}

								conversationHistory.push(modelContent);

								const functionCalls = modelContent.parts?.filter(part => part.functionCall);

								if ( !functionCalls || functionCalls.length === 0 ) {

									return Object.assign(response, {
										automaticFunctionCallingHistory: conversationHistory.slice(0, -1)
									});
								}

								if ( callableTools.length === 0 ) {
									throw new Error(
										"model requested function calls but no CallableTool implementations provided"
									);
								}

								const allResults: Part[] = [];

								for (const tool of callableTools) {
									const results = await tool.callTool(
										functionCalls.map(fc => fc.functionCall!).filter(Boolean)
									);
									allResults.push(...results);
								}

								conversationHistory.push({
									role: "user",
									parts: allResults
								});
							}

							throw new Error(`maximum turns (${maximumRemoteCalls}) reached without completion`);
						}

						async function callModel() {
							return await retry(
								throttle,
								params.model,
								() => generateContent({
									...params,
									contents: conversationHistory,
									config: { ...configWithoutSchema, tools }
								}, ...rest),
								{
									monitor: (error) => {
										if ( error instanceof ApiError && error.status === 429 ) {

											const retryDelay = (error as any).error?.details
												?.find((d: any) => d["@type"]?.includes("RetryInfo"))
												?.retryDelay;

											const match = retryDelay?.match(/^(\d+(?:\.\d+)?)s$/);

											return match ? Math.ceil(parseFloat(match[1])*1000) : undefined;

										} else {

											return undefined;

										}
									}
								}
							);
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
 *
 * When automatic function calling is used, validates that the final response contains output text.
 * A complete response should have text in `candidates[0].content.parts` after function calling completes.
 * If the final response has no output text, this indicates the generation was interrupted or incomplete.
 *
 * @param response Response from a generateContent call
 *
 * @returns Trimmed text content from the final response
 *
 * @throws Error if response validation fails or contains no output text
 */
export function text(response: GenerateContentResponse): string {

	const afc = response.automaticFunctionCallingHistory;
	const parts = response.candidates?.[0]?.content?.parts ?? [];

	if ( afc?.length && !parts.some(part => part.text && !part.thought) ) {
		throw new Error(`incomplete generation with no output text`);
	}

	return parts
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
 * Executes an async function with retry logic using adaptive throttling.
 *
 * Implements the same approach as the Java OpenAI retry logic, using a shared
 * throttle per model to coordinate rate limiting across all requests.
 *
 * @param throttle Throttle instance for rate limiting
 * @param model Model name for logging
 * @param task Async function to execute
 * @param options Retry options
 * @param options.attempts Maximum retry attempts (0 = unlimited, default: 0)
 * @param options.monitor Optional callback to determine if an error is retryable and extract
 *                        API-specified delay. Returns `undefined` for non-retryable errors (will be thrown),
 *                        or a number (in milliseconds) for retryable errors:
 *                        0 = use default backoff, >0 = use API-specified delay
 *
 * @returns Result of the function call
 *
 * @throws Original error if non-retryable (monitor returns undefined) or max attempts exceeded
 */
async function retry<T>(
	throttle: ReturnType<typeof Throttle>,
	model: string,
	task: () => Promise<T>,
	{

		attempts = 0,

		monitor

	}: {

		attempts?: number

		monitor?: (error: unknown) => undefined | number

	} = {}
): Promise<T> {

	for (let attempt = 0; attempts === 0 || attempt < attempts; attempt++) {
		try {

			const delay = await throttle.queue(true);

			logger.info`${model} / request attempt ${attempt+1} submitted with delay ${delay} ms`;

			const result = await task();

			throttle.adapt(true);

			return result;

		} catch ( error ) {

			const apiDelay = monitor?.(error);

			if ( apiDelay === undefined ) {

				// non-retryable error

				throttle.adapt(false);

				throw error;

			} else {

				// retryable error with API-specified or default delay

				const delay = apiDelay > 0
					? throttle.adapt(apiDelay)
					: throttle.adapt(false);

				logger.warning`${model} / request attempt ${attempt+1} rejected with delay ${delay} ms`;

			}

		}
	}

	throw new Error(`request aborted after ${attempts} attempts`);

}
