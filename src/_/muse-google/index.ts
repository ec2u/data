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
 * Gemini API access.
 *
 * Provides a Gemini API client for content generation, function calling and embedding, together with the conversions
 * stating a request payload as a response schema and turning a model response into the text, JSON payload or embedding
 * it was requested for, so that a consumer draws on the Gemini models without pacing requests, restating payloads or
 * unpacking responses of its own.
 *
 * @module index
 *
 * @remarks
 *
 * Clients are configured by the consumer binding them, so that credentials and endpoint are settled once for a whole
 * execution rather than by each job. Two limitations of the API are taken over on the consumer's behalf: requests are
 * paced against the published rate quotas and resumed after the delay the API advertises, and a requested response
 * schema is honoured on every model, including the ones rejecting it alongside tools. An expected payload is declared
 * by the shape already describing it rather than by a schema restating it by hand, and a response is unpacked only if
 * complete and well-formed, an incomplete or malformed generation being rejected rather than handed over in part.
 *
 * @see {@link https://ai.google.dev/gemini-api/docs Gemini API}
 * @see {@link https://googleapis.github.io/js-genai/release_docs/index.html Google GenAI SDK}
 */

import { memoize } from "@/_/core/memoize.js";
import type { Vector } from "@/_/muse/index.js";
import {
	ApiError,
	CallableTool,
	Content,
	ContentListUnion,
	EmbedContentResponse,
	GenerateContentResponse,
	GoogleGenAI,
	GoogleGenAIOptions,
	Part,
	type Schema,
	Type
} from "@google/genai";
import type { ResourceShape } from "@metreeca/blue/resource";
import { date, email, instant, iri, time, timestamp, url } from "@metreeca/blue/string";
import type { Shape } from "@metreeca/blue/value";
import { eager, isString, type Lazy, opt, type Optional, type Value } from "@metreeca/core";
import { createThrottle, type Throttle } from "@metreeca/core/async";
import { markdown } from "@metreeca/core/strings";
import { BadRequest, TooManyRequests } from "@metreeca/http";
import type { Dictionary } from "@metreeca/qest/resource";
import { log, Logger, report } from "@metreeca/tape";


/**
 * The number of attempts a request is submitted for, the initial one included, before a transient rejection is handed
 * over to the throttle (see {@link createGoogleAI}).
 */
const attempts = 5;

/**
 * The response schema constraint each well-known lexical pattern stands for.
 *
 * Tells apart the textual shapes an XSD datatype leaves undistinguished, a URL and a language tag alike being stated as
 * strings: the pattern a shape factory fixes stands for the lexical form its values are drawn from, so a shape stating
 * that pattern is described by that form rather than by the pattern spelling it out. A shape stating a pattern of its
 * own is described by that pattern instead, whatever datatype it is filed under, as the pattern is then the only form
 * its values are actually held to.
 */
const lexicons = new Map<Optional<string>, Schema>([

	[url().pattern, { format: "uri" }],
	[iri().pattern, { format: "uri" }],
	[email().pattern, { format: "email" }],

	// stated as a zoneless pattern rather than as the format they are drawn from: a model offered the RFC 3339
	// reading closes every answer with a designator, at times a lowercase one the datatype then rejects

	[date().pattern, { pattern: "^\\d{4}-\\d{2}-\\d{2}$" }],
	[time().pattern, { pattern: "^\\d{2}:\\d{2}:\\d{2}$" }],

	[instant().pattern, { format: "date-time" }],
	[timestamp().pattern, { format: "date-time" }]

]);

/**
 * The response schema converted for a shape, retained for the lifetime of the module (see {@link memoize}).
 */
const schemas: (shape: Lazy<ResourceShape>) => Schema  = memoize(shape =>
	compile(eager(shape))
);



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a Gemini API client patched to work around known API limitations.
 *
 * The client exposes the full {@link GoogleGenAI} surface with its request-issuing model methods paced against
 * the published quotas, and a patched `models.generateContent` driving function calling through a throttled loop and
 * honouring a requested response schema on every model.
 *
 * @param options The client options, as accepted by the {@link GoogleGenAI} constructor; if omitted, the SDK
 *                defaults apply, reading the API key from the environment. Retry options are stated on the caller's
 *                behalf unless `httpOptions.retryOptions` states its own
 *
 * @returns A patched client sharing throttling, logging and structured output capability among all requests naming
 *          the same model, keyed by the exact model id, so the bare and `models/`-prefixed forms of a model id are
 *          tracked independently
 *
 * @remarks
 *
 * The patch works around two API limitations:
 *
 * - **Quota control**: every request is paced against a per-model adaptive throttle and retried after the `RetryInfo`
 *   delay the API advertises, so that a long run keeps within the published rate quota instead of failing on the 429
 *   errors the SDK neither paces nor recovers from. A transient rejection short of a quota one, as a model reporting
 *   itself overloaded, is retried by the SDK before ever reaching the throttle, which the SDK does only where retry
 *   options are stated: a run outlives a spike in demand on the model rather than aborting on the first one. Function
 *   calling turns are driven here rather than by the SDK, one
 *   throttled request each, unlimited unless `automaticFunctionCalling.maximumRemoteCalls` bounds them; only
 *   `CallableTool` tools are dispatched, and a request disabling automatic function calling is submitted once, with
 *   its function calls left to the caller.
 *
 * - **Structured output**: a requested response schema is honoured on every model, though the API accepts
 *   `responseMimeType`/`responseSchema` alongside `tools` only from the Gemini 3 generation onwards: a model that
 *   doesn't take the schema replies in prose, which a further lightweight request converts into schema-conformant
 *   JSON, at the cost of one extra generation. Capability is tracked per model and corrected on rejection.
 *
 * @see {@link https://ai.google.dev/gemini-api/docs/function-calling Function calling}
 * @see {@link https://ai.google.dev/gemini-api/docs/structured-output Structured output}
 * @see {@link https://ai.google.dev/gemini-api/docs/rate-limits Rate limits}
 * @see {@link https://github.com/googleapis/js-genai/issues/727 js-genai#727}
 */
export function createGoogleAI(options: GoogleGenAIOptions = {}) {

	const ai = new GoogleGenAI({

		...options,

		httpOptions: {

			// the SDK retries a transient rejection only where retry options are stated, otherwise
			// failing the request outright: a spike in demand on the model would abort a whole run

			retryOptions: { attempts },

			...options.httpOptions

		}

	});

	/**
	 * Retrieves the request channel shared by all requests to a model, opening it on first request.
	 *
	 * Channels are memoised by model id exactly as supplied, so the bare and `models/`-prefixed forms of the same
	 * model are throttled and logged independently, each under a category naming the model alone rather than this
	 * module, so that a run reads as a list of models rather than of repeated module paths. The `structured` flag
	 * records whether the model is currently expected to accept a response schema alongside tools: the Gemini API
	 * supports the combination from the Gemini 3 generation onwards, so the generation read from the `gemini-` segment
	 * of the id, whichever prefix it carries, seeds the flag, while a rejection clears it in place (see {@link retry}).
	 *
	 * @param model The target model name
	 *
	 * @returns The channel registered for `model`, retained for the lifetime of the client (see {@link memoize})
	 *
	 * @see {@link https://ai.google.dev/gemini-api/docs/structured-output Structured output}
	 */
	const channels = memoize<string, {

		structured: boolean

		logger: Logger
		throttle: Throttle

	}>(model => {

		const generation = Number(model.match(/(?:^|\/)gemini-(\d+)/)?.[1] ?? 0);

		return {

			structured: generation >= 3,

			logger: log(["/", model]),

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
						: await submit(params.model, () => generateContent({ ...params, config }, ...rest));


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
					 * and handed over as they come, function calls included.
					 *
					 * @returns The final response of the function calling loop, or the single response to a request
					 *          that disables it
					 *
					 * @throws {@link !Error Error} If the function calling loop cannot be completed (see {@link afc})
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
						 * model requests (see {@link retry}) with tool dispatch: the function calls requested by the
						 * model are submitted to every `CallableTool` declared in the request and the resulting
						 * parts are appended to the history for the next turn, until a response reports no call.
						 *
						 * @returns The final model response, with the conversation history attached as
						 *          `automaticFunctionCallingHistory`
						 *
						 * @throws {@link !Error Error} If a response carries no model content, if a function is
						 *         requested while no callable tool is declared, or if `maximumRemoteCalls` turns
						 *         are exhausted without a final response
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
						 * @throws {ApiError} If the request fails for a reason the throttle cannot recover from
						 */
						async function retry(contents: ContentListUnion) {

							return await submit(params.model, () => generateContent({
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

							}, ...rest), schema);


							/**
							 * States the delay a request rejected over its response schema is to be retried after.
							 *
							 * @param error The rejection to recover from
							 *
							 * @returns 0, retrying at once without the schema, if `error` reports the model refusing
							 *          it; undefined otherwise, leaving the rejection to the quota recovery of
							 *          {@link submit}
							 */
							function schema(error: unknown): undefined | number {

								if ( error instanceof ApiError && error.status === BadRequest && channel.structured ) {

									// the model doesn't accept a response schema alongside tools: close the channel to
									// schemas and immediately retry the same request without one, leaving the
									// conversion to `structure`

									channel.structured = false;

									channel.logger.warning`response schema rejected with tools: converting separately`;

									return 0;

								} else {

									return undefined;

								}

							}

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
					 * @throws {@link !Error Error} If the response to convert carries no text
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

							const converter = "gemini-2.5-flash-lite";

							const data = await submit(converter, () => generateContent({
								model: converter,
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
							}));

							return {
								...response,
								candidates: data.candidates
							};

						}
					}

				};

			})(ai.models.generateContent.bind(ai.models)),

			generateContentStream: throttled(ai.models.generateContentStream.bind(ai.models)),
			embedContent: throttled(ai.models.embedContent.bind(ai.models)),

			countTokens: throttled(ai.models.countTokens.bind(ai.models)),
			computeTokens: throttled(ai.models.computeTokens.bind(ai.models)),

			generateImages: throttled(ai.models.generateImages.bind(ai.models)),
			generateVideos: throttled(ai.models.generateVideos.bind(ai.models))

		})

	});


	/**
	 * Submits a request under the throttle of the model it targets.
	 *
	 * Requests to the same model are paced against a shared adaptive throttle, so that concurrent consumers of a model
	 * keep within its published rate quota, and a rejection reporting a `RetryInfo` delay is retried after the delay
	 * the API advertises rather than at a pace of the client's own.
	 *
	 * @param model The target model name, keying the channel the request is paced against (see {@link channels})
	 * @param request The request to submit
	 * @param recover The recovery to attempt before the quota one, if any
	 *
	 * @returns The value `request` resolves to
	 *
	 * @throws {ApiError} If the request fails for a reason neither `recover` nor the quota recovery handles
	 */
	function submit<V>(model: string, request: () => Promise<V>,
		recover?: (error: unknown) => undefined | number
	): Promise<V> {

		const { throttle, logger: mlogger } = channels(model);

		return throttle.retry(request, {

			recover: error => recover?.(error) ?? quota(error),

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

		});

	}

	/**
	 * States the delay a request rejected over the rate quota is to be retried after.
	 *
	 * @param error The rejection to recover from
	 *
	 * @returns The delay advertised by the API, in ms, if `error` reports an exhausted quota alongside a `RetryInfo`
	 *          detail; undefined otherwise, leaving the rejection to the caller
	 *
	 * @see {@link https://ai.google.dev/gemini-api/docs/rate-limits Rate limits}
	 */
	function quota(error: unknown): undefined | number {

		if ( error instanceof ApiError && error.status === TooManyRequests ) {

			const delay = (error as ApiError & { // ;(cast) the SDK error type carries no quota details
				error?: { details?: readonly Record<string, unknown>[] }
			}).error?.details
				?.find(detail => `${detail["@type"]}`.includes("RetryInfo"))
				?.["retryDelay"];

			const match = `${delay}`.match(/^(\d+(?:\.\d+)?)s$/);

			return match ? Math.ceil(parseFloat(match[1])*1000) : undefined;

		} else {

			return undefined;

		}

	}

	/**
	 * Adapts a model method into one submitting its requests under the throttle of the model they target.
	 *
	 * @typeParam P The type of the request parameters, naming the target model
	 * @typeParam V The type of the value the method resolves to
	 *
	 * @param method The model method to adapt
	 *
	 * @returns A method submitting the requests of `method` through {@link submit}
	 */
	function throttled<P extends { model: string }, V>(method: (params: P) => Promise<V>): (params: P) => Promise<V> {

		return params => submit(params.model, () => method(params));

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Converts a resource shape into a Gemini response schema.
 *
 * States as a response schema the payload a shape already describes, so that a request declares what it expects once
 * rather than as a schema restating it by hand.
 *
 * A resource is stated as an object carrying one property per member: the members admitting at least one value are
 * listed as required, a member admitting more than one is stated as an array of its range, and the identifier and
 * class members naming a resource are left out, as a model states neither. A reference is stated as the identifier it
 * carries, a nested resource as a nested object, and a union as the alternatives it admits.
 *
 * The constraints a model can be held to are carried through: the lexical form a string is drawn from, the values it
 * restricts itself to, its length bounds, the bounds of a number and whether it admits integers alone. A string is
 * stated by the format its lexical pattern is drawn from, and by the pattern itself where it is drawn from none.
 *
 * The guidance a shape states for a reader is carried through as well, so that a request briefs the model from the
 * shape rather than from a prompt restating it: a resource is titled and described by the name and the description it
 * carries, and so is each member, a member admitting more than one value annotating the array rather than its items. A
 * localised name or description is carried as its English reading, and one stated in no English is left out.
 *
 * The schema converted for a shape is handed back on every later request for the same shape, so a request declaring
 * the shape it expects converts it once, however often it runs.
 *
 * @param shape The shape describing the expected payload, possibly deferred
 *
 * @returns The response schema describing the values `shape` admits
 *
 * @throws {@link !RangeError RangeError} If `shape` admits at any depth a range with no counterpart in a response
 * schema, as a localised value keyed by the language tags it happens to carry has none
 *
 * @see {@link https://ai.google.dev/gemini-api/docs/structured-output Structured output}
 */
export function schema(shape: Lazy<ResourceShape>): Schema {
	return schemas(shape);
}


/**
 * Extracts the output text of a Gemini API response.
 *
 * Thinking parts and function calls are skipped, so only the text generated for the caller is returned. Responses that
 * completed a function calling session without producing output text are rejected as incomplete generations.
 *
 * @param response The response of a `generateContent` request
 *
 * @returns The trimmed output text of `response`, joining the text of multiple parts with blank lines
 *
 * @throws {@link !Error Error} If `response` completed function calls without producing output text
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
 * Extracts the output text of a Gemini API response as a JSON payload.
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
 * @throws {@link !Error Error} If `response` carries no output text (see {@link text}) or its text is not well-formed
 * JSON
 *
 * @see {@link schema}
 */
export function json<T extends Value = Value>(response: GenerateContentResponse): T {

	try {

		return JSON.parse(text(response));

	} catch ( e ) {

		throw new Error(`malformed model response: ${report(e)}`);

	}

}

/**
 * Extracts the embedding of a Gemini API response.
 *
 * @param response The response of an `embedContent` request
 *
 * @returns The {@link Vector} embedded for the first content of `response`, or an empty array if it carries none
 */
export function embedding(response: EmbedContentResponse): Vector {

	return response.embeddings?.[0]?.values ?? [];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Describes the values a shape admits.
 *
 * @param shape The shape to describe
 *
 * @returns The response schema describing the values `shape` admits
 *
 * @throws {@link !RangeError RangeError} If `shape`, or a shape reached from it, has no counterpart in a response
 * schema
 */
function compile(shape: Shape): Schema {

	switch ( shape.kind ) {

		case "boolean":

			return { type: Type.BOOLEAN };

		case "number":

			return {

				type: shape.integral ? Type.INTEGER : Type.NUMBER,

				...(shape.minInclusive !== undefined ? { minimum: shape.minInclusive } : {}),
				...(shape.maxInclusive !== undefined ? { maximum: shape.maxInclusive } : {})

			};

		case "dictionary": // keyed by the language tags a value happens to carry, which a schema has no way to name

			throw new RangeError(`unsupported localised <${shape.kind}> range in response schema`);

		case "string":

			return {

				type: Type.STRING,

				...(opt(shape.in, values => ({ format: "enum", enum: [...values] }))
					?? lexicons.get(shape.pattern)
					?? opt(shape.pattern, pattern => ({ pattern }))
					?? {}),

				...(shape.minLength !== undefined ? { minLength: `${shape.minLength}` } : {}),
				...(shape.maxLength !== undefined ? { maxLength: `${shape.maxLength}` } : {})

			};

		case "reference":

			return { type: Type.STRING, format: "uri" };

		case "resource":

			const members = Object.entries(shape.members).flatMap(([name, member]) =>
				member.kind === "property" ? [{ name, member, range: member.range }] : []
			);

			const required = members
				.filter(({ range }) => (range.minCount ?? 0) > 0)
				.map(({ name }) => name);

			return {

				type: Type.OBJECT,

				...annotate(shape),

				properties: Object.fromEntries(members.map(({ name, member, range }) => [name, {

					...(range.maxCount === 1
						? compile(eager(range.shape))
						: { type: Type.ARRAY, items: compile(eager(range.shape)) }),

					...annotate(member)

				}])),

				...(required.length > 0 ? { required } : {})

			};

		case "union":

			return { anyOf: shape.branches.map(branch => compile(eager(branch))) };

	}

}

/**
 * States the guidance a shape carries as schema annotations.
 *
 * @param constraints The name and the description to state, possibly localised, as a shape or one of its members
 *                    carries them
 *
 * @returns An object carrying the English reading of the stated name as a title and of the stated description as a
 *          description, each left out if undefined or stated in no English
 */
function annotate({ name, description }: {

	readonly name?: string | Dictionary
	readonly description?: string | Dictionary

}): { readonly title?: string, readonly description?: string } {

	return {
		...opt(english(name), title => ({ title })),
		...opt(english(description), text => ({ description: text }))
	};

}

/**
 * Reads a localised text in English.
 *
 * @param text The text to read, either a plain string or localised by language tag
 *
 * @returns The English reading of `text`, with the entries of a multi-valued one run together as paragraphs; undefined
 *          if `text` is undefined or states no English entry
 */
function english(text: Optional<string | Dictionary>): Optional<string> {

	return text === undefined ? undefined
		: isString(text) ? text
			: opt(text.en, entry => isString(entry) ? entry : entry.join("\n\n"));

}
