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
 * OpenAI API access.
 *
 * Provides an OpenAI API client for chat completion and embedding, together with the accessors turning a model
 * response into the text, JSON payload or embedding it was requested for, so that a consumer draws on the OpenAI
 * models without pacing requests or unpacking responses of its own.
 *
 * @module index
 *
 * @remarks
 *
 * Clients are configured by the consumer binding them, so that credentials and endpoint are settled once for a whole
 * execution rather than by each job. One limitation of the API is taken over on the consumer's behalf: requests naming
 * a model are paced against the published rate quotas and resumed after the delay the API advertises, whichever
 * resource issued them. Responses are unpacked by {@link text}, {@link json} and {@link embedding}, which fail on
 * incomplete or malformed generations rather than handing a partial result over.
 *
 * @see {@link https://platform.openai.com/docs/api-reference OpenAI API}
 * @see {@link https://github.com/openai/openai-node OpenAI Node API Library}
 */

import { memoize } from "../core/memoize.js";
import type { Vector } from "../muse/index.js";
import { isObject, isString, type Value } from "@metreeca/core";
import { createThrottle, type Throttle } from "@metreeca/core/async";
import { TooManyRequests } from "@metreeca/http";
import { log, type Logger, report } from "@metreeca/tape";
import { type ClientOptions, OpenAI } from "openai";


/**
 * The error code the API reports when the account has no quota left to spend.
 *
 * @see {@link https://platform.openai.com/docs/guides/error-codes API error codes}
 */
const Exhausted = "insufficient_quota";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * A rate-limited request awaiting a further attempt.
 *
 * Never escapes the request it was raised for: it is raised only where the throttle is known to recover from it, and
 * consumed by the recovery that resumes the request.
 */
class Limited extends Error {

	/**
	 * The delay the request is to be resumed after, in ms, or 0 to leave the pace to the throttle.
	 */
	readonly delay: number;

	/**
	 * Creates a rate-limited request marker.
	 *
	 * @param delay The delay the request is to be resumed after, in ms, or 0 to leave the pace to the throttle
	 */
	constructor(delay: number) {

		super(`exceeded rate quota with delay <${delay}> ms`);

		this.delay = delay;

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an OpenAI API client paced against the published rate quotas.
 *
 * The client exposes the full {@link OpenAI} surface, with overloads, streaming and response helpers unaltered, and
 * every request naming a model held back by a per-model adaptive throttle, so that a long run keeps within the
 * published rate quota instead of failing on the 429 errors the SDK neither paces nor recovers from.
 *
 * @param options The client options, as accepted by the {@link OpenAI} constructor; if omitted, the SDK defaults
 *                apply, reading the API key from the environment
 *
 * @returns A client sharing throttling and logging among all requests naming the same model, keyed by the exact model
 *          id, so that variant spellings of a model are tracked independently
 *
 * @throws {@link !Error Error} If `options` supplies no credentials and none is published by the environment, as
 * signalled by the SDK through an `OpenAIError`
 *
 * @remarks
 *
 * Quota control covers every request naming a model, whichever resource issued it and whatever the SDK version offers,
 * as it is applied where requests are dispatched rather than at each resource method: a rejection reporting
 * `retry-after-ms` or `retry-after` is resumed after the delay the API advertises, and one reporting no delay at the
 * pace the throttle settles on. A rejection reporting an exhausted account is handed over as it stands, as no delay
 * recovers from it. Requests naming no model, such as listing files or models, are dispatched as they come.
 *
 * Pacing rests on a request dispatcher of the client's own, which the SDK replaces when X.509 workload identity
 * credentials are supplied: a client authenticated that way is served through the SDK transport and left unpaced.
 * Retrying is left to the SDK for everything but the rate quota, so `maxRetries` still governs recovery from network
 * failures and server errors.
 *
 * @see {@link https://platform.openai.com/docs/guides/rate-limits Rate limits}
 * @see {@link https://platform.openai.com/docs/guides/error-codes API error codes}
 */
export function createOpenAI(options: ClientOptions = {}) {

	const dispatch = options.fetch ?? fetch;

	/**
	 * Retrieves the request channel shared by all requests to a model, opening it on first request.
	 *
	 * Channels are memoised by model id exactly as submitted, each logging under a category naming the model alone
	 * rather than this module, so that a run reads as a list of models rather than of repeated module paths.
	 *
	 * @param model The target model name
	 *
	 * @returns The channel registered for `model`, retained for the lifetime of the client (see {@link memoize})
	 */
	const channels = memoize<string, {

		logger: Logger
		throttle: Throttle

	}>(model => ({

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

	}));


	return new OpenAI({ ...options, fetch: submit });


	/**
	 * Dispatches a request under the throttle of the model it targets.
	 *
	 * @param input The endpoint the request is addressed to
	 * @param init The request to dispatch
	 *
	 * @returns The response to `init`, resumed as many times as the rate quota requires
	 *
	 * @throws {@link !TypeError TypeError} If the request cannot be dispatched
	 */
	async function submit(input: string | URL | Request, init?: RequestInit): Promise<Response> {

		const model = target(init);

		if ( model === undefined ) { // no model to pace against

			return await dispatch(input, init);

		} else {

			const { logger, throttle } = channels(model);

			return await throttle.retry(async () => {

				const response = await dispatch(input, init);
				const delay = await limited(response);

				if ( delay !== undefined ) {
					throw new Limited(delay);
				}

				return response;

			}, {

				recover: error => error instanceof Limited ? error.delay : undefined,

				monitor: (attempt, attempts, elapsed) => {

					const count = attempts > 0 ? `${attempt+1}/${attempts}` : `${attempt+1}`;

					if ( elapsed === undefined ) {
						logger.error`request attempt ${count} aborted`;
					} else if ( attempt > 0 ) {
						logger.warning`request attempt ${count} rejected with delay ${elapsed} ms`;
					} else {
						logger.info`request attempt ${count} submitted with delay ${elapsed} ms`;
					}

				}

			});

		}

	}

	/**
	 * States the delay a request rejected over the rate quota is to be resumed after.
	 *
	 * @param response The response to recover from
	 *
	 * @returns The delay the request is to be resumed after, in ms, as advertised by the API, or 0 if it advertises
	 *          none, if `response` reports the rate quota exceeded; undefined if it reports anything else or an
	 *          account with no quota left to spend, leaving `response` to the SDK
	 */
	async function limited(response: Response): Promise<undefined | number> {

		if ( response.status !== TooManyRequests || await exhausted(response) ) {

			return undefined;

		} else {

			return delay(response.headers);

		}

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Extracts the output text of a chat completion.
 *
 * @param completion The completion of a `chat.completions.create` request
 *
 * @returns The trimmed output text of the first choice of `completion`
 *
 * @throws {@link !Error Error} If `completion` carries no choice, if the model refused to generate, or if it stopped
 * before producing complete output text
 */
export function text(completion: OpenAI.ChatCompletion): string {

	const choice = completion.choices[0];

	if ( choice === undefined ) {
		throw new Error("missing completion choice");
	}

	const { finish_reason, message: { content, refusal } } = choice;

	if ( refusal ) {

		throw new Error(`refused generation <${refusal}>`);

	} else if ( finish_reason === "length" || finish_reason === "content_filter" ) {

		throw new Error(`incomplete generation with reason <${finish_reason}>`);

	} else if ( !content ) {

		throw new Error("incomplete generation with no output text");

	} else {

		return content.trim();

	}

}

/**
 * Extracts the output text of a chat completion as a JSON payload.
 *
 * The payload is parsed from the output text of the completion, as produced under the requested response format, and
 * cast to `T` without further validation: callers needing guarantees must validate it themselves.
 *
 * @typeParam T The expected shape of the JSON payload
 *
 * @param completion The completion of a `chat.completions.create` request carrying a JSON response format
 *
 * @returns The JSON payload parsed from the output text of `completion`
 *
 * @throws {@link !Error Error} If `completion` carries no output text (see {@link text}) or its text is not
 * well-formed JSON
 */
export function json<T extends Value = Value>(completion: OpenAI.ChatCompletion): T {

	try {

		return JSON.parse(text(completion));

	} catch ( e ) {

		throw new Error(`malformed model response: ${report(e)}`);

	}

}

/**
 * Extracts the embedding of an OpenAI API response.
 *
 * @param response The response of an `embeddings.create` request
 *
 * @returns The {@link Vector} embedded for the first input of `response`, or an empty array if it carries none
 */
export function embedding(response: OpenAI.CreateEmbeddingResponse): Vector {

	return response.data[0]?.embedding ?? [];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * States the model a request is addressed to.
 *
 * Only requests whose payload may be dispatched again name a model, so that a request resumed under the rate quota is
 * never one whose payload was consumed by the attempt that was rejected.
 *
 * @param init The request to inspect
 *
 * @returns The model named by the payload of `init`, or undefined if it names none or carries a payload that cannot
 *          be dispatched again
 */
function target(init?: RequestInit): undefined | string {

	const body = init?.body;

	if ( isString(body) ) {

		const payload = decode(body);

		return isObject(payload) && isString(payload["model"]) ? payload["model"] : undefined;

	} else if ( body instanceof FormData ) {

		const model = body.get("model");

		return isString(model) ? model : undefined;

	} else {

		return undefined;

	}

}

/**
 * States whether a rejection leaves the account with no quota to spend.
 *
 * @param response The rejection to inspect
 *
 * @returns True if `response` reports an exhausted account, which no delay recovers from; false otherwise
 */
async function exhausted(response: Response): Promise<boolean> {

	const payload = decode(await response.clone().text().catch(() => ""));

	return isObject(payload)
		&& isObject(payload["error"])
		&& payload["error"]["code"] === Exhausted;

}

/**
 * States the delay a rejection advertises.
 *
 * @param headers The headers of the rejection to inspect
 *
 * @returns The delay advertised by `headers`, in ms, or 0 if they advertise none, leaving the pace to the throttle
 *
 * @see {@link https://platform.openai.com/docs/guides/rate-limits Rate limits}
 */
function delay(headers: Headers): number {

	const ms = Number(headers.get("retry-after-ms"));
	const s = Number(headers.get("retry-after"));

	if ( Number.isFinite(ms) && ms > 0 ) {

		return Math.ceil(ms);

	} else if ( Number.isFinite(s) && s > 0 ) {

		return Math.ceil(s*1000);

	} else {

		return 0;

	}

}

/**
 * Decodes a JSON payload.
 *
 * @param text The text to decode
 *
 * @returns The value `text` encodes, or undefined if it is not well-formed JSON
 */
function decode(text: string): unknown {

	try {

		return JSON.parse(text);

	} catch {

		return undefined;

	}

}
