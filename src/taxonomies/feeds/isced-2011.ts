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

import { secret } from "@/_/gcp/secrets.js";
import { csv } from "@/_/flow/formats/csv/index.js";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/structures";
import { pipe, type Task } from "@metreeca/pipe";
import { items } from "@metreeca/pipe/feeds";
import { forEach, toArray } from "@metreeca/pipe/sinks";
import { take } from "@metreeca/pipe/tasks";
import { log } from "@metreeca/tape";
import { createFetch, type Middleware } from "@metreeca/core/fetch";
import { createThrottle } from "@metreeca/core/async";


const DataURL = "taxonomies-ec2u-isced-2011";

const CSVFormat = immutable({

	header: true,
	skip: true,
	trim: true

});


if ( import.meta.main ) {
	sync();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

type Concept = {

	readonly id: string;
	readonly label: string;
	readonly alternative: string;
	readonly definition: string;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function sync() {

	const url = await secret(DataURL);

	// !!! service injection
	// !!! fetcher
	// !!! caching

	await pipe(
		(items(url))
		(http())
		(csv<Concept>(CSVFormat))
		(take(3))
		(forEach(console.log))
	);

}


//// !!! ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const URLLengthLimit = 80;

const logger = log(import.meta.url);

/**
 * Creates a resource retrieval task.
 *
 * The generated task reads a stream of requests as a stream of byte chunks, reporting the body of each response as its
 * chunks are received; requests are given as accepted by `fetch()`, that is as URL strings, {@link URL} objects or
 * {@link Request} objects.
 *
 * Chunks are pulled from the response as they are asked for, so resources of any size are handled without holding them
 * in memory and a consumer that stops early cancels the response; a response reporting no body is read as an empty
 * stream.
 *
 * > [!WARNING]
 * > Responses reporting an unsuccessful status are skipped and reported to the log, leaving the stream to run to
 * > completion.
 *
 * @param middlewares The middlewares to be layered over the standard `fetch` function, in request processing order
 *
 * @returns A task converting a stream of requests into a stream of response byte chunks
 *
 * @throws Error While iterating the returned stream, whatever the retrieval reports while connecting to a resource or
 *               receiving its response
 */
function http(... middlewares: readonly Middleware[]): Task<string | URL | Request, Uint8Array> {

	return async function* (requests) {

		const fetcher = createFetch(...middlewares, () => fetch); // !!! via service locator

		for await ( const request of requests ) {

			const { method, url } = request instanceof Request ? request : { method: "GET", url: request.toString() };

			logger.info`${method} ${clip(url, URLLengthLimit)}`;

			const response = await fetcher(request);

			if ( response.ok ) {

				yield* response.body ?? []; // a response reporting no body is read as an empty stream

			} else {

				logger.warn`${method} ${clip(url, URLLengthLimit)} >> ${response.status} ${response.statusText}`;

			}

		}

	};

}


/**
 * Creates a throttling middleware.
 *
 * The generated middleware paces the exchanges routed through it, waiting before each request for the throttle to
 * grant it and reporting the outcome back, so that the baseline delay adapts to what the server replies: a successful
 * exchange speeds up the client, a failed one slows it down, and a response asking for a delay through a `Retry-After`
 * header field, in either the delta seconds or the HTTP date form, sets it explicitly.
 *
 * Exchanges failing on a transient status, that is `408`, `429` or any `5xx`, are retried as the throttle directs, up
 * to the given number of attempts; every other unsuccessful exchange, and the last attempt of an exhausted one, is
 * relayed to the caller as is, so that status handling stays with the consumer.
 *
 * @param options The throttling options, as defined by {@link createThrottle}, extended with the retry budget
 * @param options.attempts The maximum number of attempts per exchange; `0` means no limit; defaults to `1`, that is to
 *                         no retries
 *
 * @returns A middleware pacing the exchanges routed through the wrapped fetch implementation
 *
 * @throws Error If any option is out of range
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9110#section-10.2.3 RFC 9110 § 10.2.3 - Retry-After}
 */
function throttle({ attempts = 1, ...options }: Parameters<typeof createThrottle>[0] & {

	readonly attempts?: number

} = {}): Middleware {


	const throttle = createThrottle(options);

	return fetcher => async (request, init) => {

		try {

			// the throttle queues each attempt and reports its outcome, pacing the retries as it paces the exchanges

			return await throttle.retry(async () => {

				const response = await fetcher(request, init);

				if ( response.ok ) { // that is, a 2xx status

					return response;

				} else {

					throw response; // reported as a failure to the retry loop, which drives off thrown values

				}

			}, {

				attempts,

				recover: error => error instanceof Response && transient(error) ? after(error) : undefined

			});

		} catch ( error ) {

			// an unsuccessful response is relayed to the caller as is, whatever the last attempt left it at

			if ( error instanceof Response ) {

				return error;

			} else {

				throw error;

			}

		}


		/**
		 * Reports if a response is worth retrying, that is if the status marks the failure as transient.
		 */
		function transient({ status }: Response): boolean {

			return status === 408 || status === 429 || status >= 500;

		}

		/**
		 * Reports the delay a response asks to be waited for in milliseconds, or `0` if none is stated.
		 */
		function after({ headers }: Response): number {

			const retry = headers.get("Retry-After") ?? "";

			// delta seconds, falling back to the HTTP date form; NaN or negative unless a delay is stated

			const seconds = Number(retry) || (Date.parse(retry)-Date.now())/1000;

			return seconds > 0 ? 1000*seconds : 0;

		}


	};

}
