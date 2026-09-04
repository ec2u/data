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
 * Gemini API client and response accessors.
 *
 * Provides a shared {@link ai} client for the Gemini API, authenticated from Secret Manager, together with accessors
 * for extracting text, JSON payloads and embedding vectors from model responses.
 *
 * @module
 *
 * @remarks
 *
 * Content generation, function calling and embedding are requested through the shared client, or through a separately
 * configured one created with {@link GoogleGenAI}; both work around the quota and structured output limitations of the
 * API. {@link text}, {@link json} and {@link embedding} take over from their responses, reporting the generated text,
 * the JSON payload produced under a requested response schema, or the embedding vector, and failing on incomplete or
 * malformed generations.
 *
 * @see {@link https://ai.google.dev/gemini-api/docs Gemini API}
 * @see {@link https://googleapis.github.io/js-genai/release_docs/index.html Google GenAI SDK}
 */

import { createCache } from "@/_/core/cache.js";
import { secret } from "@/_/gcp/secrets.js";
import {
	ApiError,
	CallableTool,
	Content,
	ContentListUnion,
	EmbedContentResponse,
	GenerateContentResponse,
	GoogleGenAI as Client,
	GoogleGenAIOptions,
	Part
} from "@google/genai";
import { isString } from "@metreeca/core";
import { createThrottle, type Throttle } from "@metreeca/core/async";
import { markdown } from "@metreeca/core/strings";
import { BadRequest, TooManyRequests } from "@metreeca/http";
import { log, Logger, report } from "@metreeca/tape";

const logger = log(import.meta.url);



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Shared Gemini API client.
 *
 * Created once at module load by {@link GoogleGenAI}, reading its key from the `googleai-key` secret, so importing
 * this module requires Secret Manager access and its requests carry the workarounds documented there.
 */
export const ai = GoogleGenAI({

	apiKey: await secret("googleai-key")

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a Gemini API client patched to work around known API limitations.
 *
 * The client exposes the full {@link Client GoogleGenAI} surface with a patched `models.generateContent`, which drives
 * function calling through a throttled loop and honours a requested response schema on every model. Requests without
 * `config.tools` reach the SDK unchanged.
 *
 * @param options The client options, as accepted by the {@link Client GoogleGenAI} constructor
 *
 * @returns A patched client sharing throttling, logging and structured output capability among all requests naming
 *          the same model, keyed by the exact model id, so the bare and `models/`-prefixed forms of a model id are
 *          tracked independently
 *
 * @remarks
 *
 * The patch works around two API limitations affecting every request that carries `config.tools`:
 *
 * - **Quota control**: the SDK resolves function calls through an internal loop that neither throttles its requests
 *   nor recovers from quota exhaustion, causing 429 failures during long tool sessions. Tool turns are driven here
 *   instead, submitting one throttled request per turn against a per-model adaptive throttle that honours the
 *   `RetryInfo` delay advertised by the API. Turns are unlimited unless `automaticFunctionCalling.maximumRemoteCalls`
 *   bounds them, and only `CallableTool` tools are dispatched; requests setting `automaticFunctionCalling.disable`
 *   are submitted through the same throttle, with their function calls left to the caller.
 *
 * - **Structured output**: the API accepts `responseMimeType`/`responseSchema` alongside `tools` only from the Gemini 3
 *   generation onwards. A requested response schema is nonetheless honoured on every model: capable models receive it
 *   with the request, while earlier ones return prose that a separate lightweight request converts into
 *   schema-conformant JSON, at the cost of one extra generation. Capability is inferred from the model id and
 *   corrected whenever the API rejects a submitted schema.
 *
 * @see {@link https://ai.google.dev/gemini-api/docs/function-calling Function calling}
 * @see {@link https://ai.google.dev/gemini-api/docs/structured-output Structured output}
 * @see {@link https://ai.google.dev/gemini-api/docs/rate-limits Rate limits}
 * @see {@link https://github.com/googleapis/js-genai/issues/727 js-genai#727}
 */
export function GoogleGenAI(options: GoogleGenAIOptions) {

	const ai = new Client(options);

	/**
	 * Retrieves the request channel shared by all requests to a model, opening it on first request.
	 *
	 * Channels are cached by model id exactly as supplied, so the bare and `models/`-prefixed forms of the same model
	 * are throttled and logged independently. The `structured` flag records whether the model is currently expected to
	 * accept a response schema alongside tools: the Gemini API supports the combination from the Gemini 3 generation
	 * onwards, so the generation read from the last path segment of the id seeds the flag, while a rejection clears it
	 * in place (see {@link retry}).
	 *
	 * @param model The target model name
	 *
	 * @returns The channel registered for `model`, retained for the lifetime of the client (see {@link createCache})
	 *
	 * @see {@link https://ai.google.dev/gemini-api/docs/structured-output Structured output}
	 */
	const channels = createCache<string, {

		structured: boolean

		logger: Logger
		throttle: Throttle

	}>(model => {

		const generation = Number(model.split("/").pop()?.match(/^gemini-(\d+)/)?.[1] ?? 0);

		return {

			structured: generation >= 3,

			logger: logger.getChild(model),

			// !!! the floor is a magic 600 rpm: derive it from the rpm published for the model, that is as
			// !!! `60_000/rpm`, so that the pace is stated by the quota rather than guessed

			// !!! a floor states requests per minute only: the token and daily quotas are not a function of
			// !!! elapsed time and are left unguarded

			// !!! quotas are enforced per project, while channels are opened per model: models running
			// !!! concurrently overrun a shared quota, each pacing correctly on its own

			throttle: createThrottle({
				minimum: 100,
				maximum: 60*1000,
				buildup: 1.10,
				backoff: 1.10,
				recover: 0.95
			})

		};

	});


	return Object.assign(ai, { // patch to work around known issues

		models: Object.assign(ai.models, {

			generateContent: (generateContent => {

				return async (...[{ config, ...params }, ...rest]: Parameters<typeof generateContent>) => {

					const channel = channels(params.model);

					return config?.tools
						? await structure(await execute())
						: await generateContent(params, ...rest);


					/**
					 * Resolves a request carrying tools, driving function calling under quota throttling.
					 *
					 * The SDK resolves function calls through an internal loop that neither throttles its requests
					 * nor recovers from quota exhaustion, so long tool sessions fail with unexpected 429 errors:
					 * function declarations count towards the token limit, every turn issues a further request, and
					 * tools such as Browser MCP or Google Search resubmit massive contexts on each one of them, as
					 * reported for other SDKs:
					 *
					 * - googleapis/python-genai#17: 429 errors with the Google Search tool
					 * - google/adk-python#1057: 1.5M tokens in ~20 requests with Browser MCP, which sends the
					 *   entire DOM as context
					 *
					 * Turns are driven by {@link afc} instead, one throttled request at a time (see {@link retry}),
					 * and a requested response schema is submitted with them wherever the model accepts it. Requests
					 * that disable automatic function calling take the same throttled route, but are submitted once
					 * and reported as they come, function calls included.
					 *
					 * @returns The final response of the function calling loop, or the single response to a request
					 *          that disables it
					 *
					 * @throws Error if the function calling loop cannot be completed (see {@link afc})
					 */
					async function execute(): Promise<GenerateContentResponse> {

						const {

							tools,

							automaticFunctionCalling: {
								disable = false,
								maximumRemoteCalls = 0
							} = {},

							responseSchema,
							responseMimeType,

							...configWithoutSchema

						} = config ?? {};


						if ( disable ) { // caller will handle function calling

							return await retry(params.contents);

						} else { // automatic function calling loop with quota throttling

							return await afc();

						}

						/**
						 * Drives the function calling loop until the model returns a final response.
						 *
						 * Normalises the request contents into a conversation history, then alternates throttled
						 * model requests (see {@link retry}) with tool dispatch: the function calls reported by the
						 * model are submitted to every `CallableTool` declared in the request and the resulting
						 * parts are appended to the history for the next turn, until a response reports no call.
						 *
						 * @returns The final model response, with the conversation history attached as
						 *          `automaticFunctionCallingHistory`
						 *
						 * @throws Error if a response carries no model content, if a function is requested while no
						 *         callable tool is declared, or if `maximumRemoteCalls` turns are exhausted without
						 *         a final response
						 */
						async function afc() {

							const callables = tools?.filter((tool): tool is CallableTool =>
								typeof tool === "object" && tool !== null && "callTool" in tool
								&& typeof tool.callTool === "function"
							) ?? [];

							const history: Content[] = (Array.isArray(params.contents)
									? params.contents
									: [params.contents]
							).map(content =>
								isString(content) ? { role: "user", parts: [{ text: content }] }
									: "role" in content && "parts" in content ? content
										: { role: "user", parts: [content as Part] }
							);

							for (let turn = 0; maximumRemoteCalls === 0 || turn < maximumRemoteCalls; turn++) {

								const response = await retry(history);

								if ( !response.candidates?.[0]?.content ) {
									throw new Error("no model content in response");
								}

								const calls = (response.candidates[0]?.content?.parts ?? [])
									.map(part => part.functionCall)
									.filter((call) => call !== undefined);

								if ( calls.length === 0 ) {

									return Object.assign(response, {
										automaticFunctionCallingHistory: history
									});

								} else {

									if ( callables.length === 0 ) {
										throw new Error(`no callable tools available to fulfill model requests <${
											calls.map(call => call.name).join(", ")
										}>`);
									}

									history.push(response.candidates[0].content, {
										role: "user",
										parts: (await Promise.all(callables.map(tool => tool.callTool(calls)))).flat()
									});

								}

							}

							throw new Error(`maximum turns (${maximumRemoteCalls}) reached without completion`);
						}

						/**
						 * Submits a single model request under the throttle of the target model.
						 *
						 * Every request carrying tools is submitted here, with the SDK function calling loop always
						 * disabled, so each call performs exactly one request and turn management stays with
						 * {@link afc}. A requested response schema is submitted only to models expected to accept it
						 * alongside tools, leaving the conversion to {@link structure} on the others. A 429 rejection
						 * is retried after the delay advertised by the API; a 400 rejection received while a response
						 * schema is being submitted is taken as the model refusing it, closing the channel to schemas
						 * (see {@link channels}) and retrying the same request at once without one.
						 *
						 * @param contents The conversation to submit
						 *
						 * @returns The model response to `contents`
						 *
						 * @throws ApiError if the request fails for a reason the throttle cannot recover from
						 */
						async function retry(contents: ContentListUnion) {

							const { throttle, logger: mlogger } = channel;

							return await throttle.retry(
								() => generateContent({
									...params,
									contents,

									config: {

										...configWithoutSchema,
										tools,

										// disable the SDK loop: it would resolve function calls without throttling,
										// leaving this loop with nothing but the final response

										automaticFunctionCalling: { disable: true },

										// submit the response schema only to models accepting it alongside tools,
										// leaving the conversion to `structure` on the others

										...(channel.structured ? { responseMimeType, responseSchema } : {})

									}

								}, ...rest),
								{

									recover: (error) => {
										if ( error instanceof ApiError && error.status === TooManyRequests ) {

											const delay = (error as any).error?.details
												?.find((d: any) => d["@type"]?.includes("RetryInfo"))
												?.retryDelay;

											const match = delay?.match(/^(\d+(?:\.\d+)?)s$/);

											return match ? Math.ceil(parseFloat(match[1])*1000) : undefined;

										} else if ( error instanceof ApiError && error.status === BadRequest
											&& channel.structured ) {

											// the model doesn't accept a response schema alongside tools: close the
											// channel to schemas and immediately retry the same request without one,
											// leaving the conversion to `structure`

											channel.structured = false;

											mlogger.warning`response schema rejected with tools: converting separately`;

											return 0;

										} else {

											return undefined;

										}
									},

									monitor: (attempt, attempts, elapsed) => {

										const count = attempts > 0 ? `${attempt+1}/${attempts}` : `${attempt+1}`;

										if ( elapsed === undefined ) {
											mlogger.error`request attempt ${count} aborted`;
										} else if ( attempt > 0 ) {
											mlogger.warning`request attempt ${count} rejected with delay ${elapsed} ms`;
										} else {
											mlogger.info`request attempt ${count} submitted with delay ${elapsed} ms`;
										}

									}

								}
							);
						}

					}

					/**
					 * Converts a final textual response into the requested structured JSON.
					 *
					 * Models earlier than the Gemini 3 generation reject a `responseMimeType` of `"application/json"`
					 * alongside `tools`, so they are served without the response schema and reply in prose: a
					 * separate `gemini-2.5-flash-lite` request converts it into JSON conforming to the requested
					 * schema, at the cost of one extra generation. Models that accept the schema with the request
					 * produce the JSON themselves and bypass the conversion (see {@link channels}).
					 *
					 * @param response The model response to post-process
					 *
					 * @returns `response` with its candidates replaced by the converted JSON, or `response` as it
					 *          stands if the model applied the schema itself, if no schema was requested, or if the
					 *          response is still awaiting tool execution
					 *
					 * @throws Error if the response to convert carries no text
					 *
					 * @see {@link https://github.com/googleapis/js-genai/issues/727 js-genai#727}
					 */
					async function structure(response: GenerateContentResponse) {

						const responseSchema = config?.responseSchema;

						const hasFunctionCalls = response.candidates?.[0]?.content?.parts?.some(
							part => part.functionCall
						);

						if ( channel.structured || !responseSchema || hasFunctionCalls ) {

							return response;

						} else {

							const input = text(response);

							if ( !input || !input.trim() ) {
								throw new Error("empty model response: unable to extract structured data");
							}

							const urls = [...new Set(input.match(/https?:\/\/[^\s\[\]()<>]+/g) || [])];

							// !!! submitted through the bare SDK method: the conversion escapes the quota control this
							// !!! patch exists to provide, reporting a raw 429 without the RetryInfo handling of
							// !!! `retry()`; route it through the channel of the converting model

							const data = await generateContent({
								model: "gemini-2.5-flash-lite",
								contents: [input, urls.length > 0
									? markdown`REFERENCE URLs found in source (use EXACTLY as written):
											${urls.map(url => `- ${url}`).join("\n")}
									`
									: "REFERENCE URLs found in source: (none identified)"
								],
								config: {
									seed: 0,
									temperature: 0,
									systemInstruction: markdown`
									
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

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Reports the output text of a Gemini API response.
 *
 * Thinking parts and function calls are skipped, so only the text generated for the caller is reported. Responses that
 * completed a function calling session without producing output text are rejected as incomplete generations.
 *
 * @param response The response of a `generateContent` request
 *
 * @returns The trimmed output text of `response`, joining the text of multiple parts with blank lines
 *
 * @throws Error if `response` completed function calls without producing output text
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
 * Reports the output text of a Gemini API response as a JSON payload.
 *
 * The payload is parsed from the output text of the response, as produced under the requested response schema, and cast
 * to `T` without further validation: callers needing guarantees must validate it themselves.
 *
 * @typeParam T The expected shape of the JSON payload
 *
 * @param response The response of a `generateContent` request carrying a response schema
 *
 * @returns The JSON payload parsed from the output text of `response`
 *
 * @throws Error if `response` carries no output text or its text is not well-formed JSON
 */
export function json<T>(response: GenerateContentResponse): T {
	try {

		return JSON.parse(text(response));

	} catch ( e ) {
		throw new Error(`malformed model response: ${report(e)}`);
	}
}

/**
 * Reports the embedding vector of a Gemini API response.
 *
 * @param response The response of an `embedContent` request
 *
 * @returns The vector embedded for the first content of `response`, or an empty array if it carries none
 */
export function embedding(response: EmbedContentResponse) {

	return response.embeddings?.[0]?.values ?? [];

}
