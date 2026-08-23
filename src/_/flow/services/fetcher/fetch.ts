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

import { createFetch, headers, type Middleware, transport } from "@metreeca/core/fetch";
import { GatewayTimeout } from "@metreeca/core/http";
import { clip } from "@metreeca/core/strings";
import type { Task } from "@metreeca/pipe";
import { log } from "@metreeca/tape";



const URLLengthLimit = 80;

// a current desktop Chrome user agent: the platform and the AppleWebKit and Safari tokens are frozen by the reduced
// user agent Chrome reports, leaving the Chrome version as the only one to be kept in step

const UserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
	+" AppleWebKit/537.36 (KHTML, like Gecko)"
	+" Chrome/151.0.0.0"
	+" Safari/537.36";

// the wildcard is weighted as Chrome weights it, so that the field is coherent with the user agent it travels with

const Accept = "text/html,"
	+"application/xhtml+xml,"
	+"application/xml;q=0.9,"
	+"*/*;q=0.8";

const AcceptEncoding = "gzip, deflate, br, zstd"; // decoded by fetch, whoever states the field


const logger = log(import.meta.url);


/**
 * Creates a resource exchange task.
 *
 * The generated task reads a stream of requests as a stream of byte chunks, reporting the body of each response as its
 * chunks are received; requests are given as accepted by the standard `fetch()` function, that is as URL strings,
 * {@link URL} objects or {@link Request} objects.
 *
 * Chunks are pulled from the response as they are asked for, so resources of any size are handled without holding them
 * in memory and a consumer that stops early cancels the response; a response reporting no body is read as an empty
 * stream.
 *
 * Exchanges are sent under desktop browser `User-Agent`, `Accept` and `Accept-Encoding` fields, so that sites serving
 * unattended clients differently, or refusing them altogether, are scraped as a browser would be; a request already
 * stating one of these fields keeps its own value, as do the ones stated by `middlewares`.
 *
 * Exchanges are given a bounded wait for their response and are recorded with the location they were effectively
 * retrieved from, as {@link timeout} and {@link location} respectively define.
 *
 * > [!WARNING]
 * > Requests stating a URL that is not absolute or is otherwise malformed, and responses reporting an unsuccessful
 * > status, are skipped and reported to the log, leaving the stream to run to completion.
 *
 * @param middlewares The middlewares to be layered over the standard `fetch` function, in request processing order
 *
 * @returns A task converting a stream of requests into a stream of response byte chunks
 *
 * @throws Error While iterating the returned stream, whatever the exchange reports while connecting to a resource or
 *               receiving its response
 */
export function fetch(... middlewares: readonly Middleware[]): Task<string | URL | Request, Uint8Array> {

	return async function* (requests) {

		const fetcher = createFetch(
			...middlewares,
			headers({

				"Accept": Accept,
				"Accept-Encoding": AcceptEncoding,
				"User-Agent": UserAgent

			}),
			timeout(ResponseTimeout),
			location(),
			transport(globalThis.fetch) // !!! via service locator
		);

		for await ( const request of requests ) {

			const method = request instanceof Request ? request.method : "GET";
			const url = clip(request instanceof Request ? request.url : request.toString(), URLLengthLimit);

			if ( typeof request === "string" && !URL.canParse(request) ) { // only a raw string may be malformed

				logger.warn`${method} ${url} >> malformed resource URL`;

			} else {

				logger.info`${method} ${url}`;

				const response = await fetcher(request);

				if ( response.ok ) {

					yield* response.body ?? []; // a response reporting no body is read as an empty stream

				} else {

					logger.warn`${method} ${url} >> ${response.status} ${response.statusText}`;

				}

			}

		}

	};

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const ResponseTimeout = 30_000;

/**
 * Creates a timeout middleware.
 *
 * The generated middleware bounds the wait for the response of each exchange routed through it, reporting a `504
 * Gateway Timeout` if the response doesn't arrive within `limit` milliseconds, so that a server that never replies is
 * handled as any other unsuccessful exchange and status handling stays with the consumer.
 *
 * The bound is lifted as soon as the response is reported, leaving its body free to be streamed for as long as it
 * takes, so that a large resource is not truncated while a slow server is given up on; a request stating a signal of
 * its own is aborted by either, whichever fires first, and an abort asked for from the outside is relayed to the caller
 * as it was reported.
 *
 * @param limit The maximum number of milliseconds to wait for a response
 *
 * @returns A middleware bounding the response wait of the exchanges routed through the wrapped fetch implementation
 *
 * @throws {RangeError} If `limit` is not a positive number
 *
 * @see {@link https://developer.mozilla.org/docs/Web/API/AbortSignal `AbortSignal`}
 */
function timeout(limit: number): Middleware {

	if ( !(limit > 0) ) {
		throw new RangeError(`malformed timeout limit <${limit}>`);
	}

	return fetcher => async (input, init) => {

		const controller = new AbortController();

		const timer = setTimeout(() => controller.abort(), limit);

		// the request is left as it was submitted, but for the signal, so that a body reaches the transport undisturbed

		const stated = input instanceof Request ? input.signal : init?.signal;

		const signal = stated ? AbortSignal.any([stated, controller.signal]) : controller.signal;

		try {

			return await fetcher(input, { ...init, signal });

		} catch ( error ) {

			// the middleware's own controller, rather than the reported cause, tells its bound from an outside abort

			if ( !controller.signal.aborted ) { throw error; }

			return new Response(null, { status: GatewayTimeout, statusText: "Gateway Timeout" });

		} finally {

			clearTimeout(timer); // the response is in: whatever it takes to read its body is not the middleware's call

		}

	};

}

/**
 * Creates a retrieval location middleware.
 *
 * The generated middleware records the URL each response was effectively retrieved from as its `Content-Location`
 * field, so that a consumer resolving relative references, as one scraping a page does, resolves them against the
 * location the redirects landed on rather than against the one the exchange started from.
 *
 * A response already stating the field keeps its own value.
 *
 * @returns A middleware recording the effective retrieval location of the responses reported by the wrapped fetch
 *     implementation
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9110#section-8.7 RFC 9110 § 8.7 - Content-Location}
 */
function location(): Middleware {

	return fetcher => async (input, init) => {

		const response = await fetcher(input, init);

		if ( !response.url || response.headers.has("Content-Location") ) {

			return response;

		} else {

			// response headers are immutable, as the fetch standard prescribes: the response is reported anew

			const headers = new Headers(response.headers);

			headers.set("Content-Location", response.url);

			return new Response(response.body, {

				status: response.status,
				statusText: response.statusText,

				headers

			});

		}

	};

}
