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


import type { Fetch, Middleware } from "@metreeca/core/fetch";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const SchemePattern = /^[a-z][a-z\d+.-]*$/;

/**
 * Creates a protocol dispatching middleware.
 *
 * The generated middleware routes each exchange to the handler registered for the scheme of its target URL, relaying
 * every other exchange to the wrapped fetch implementation: the schemes the platform already serves keep flowing to it
 * untouched, while the ones it doesn't, such as `file` or `zip`, are supplied by a handler without the consumer having
 * to know which is which.
 *
 * Handlers are {@link Fetch} implementations, so they see the exchange exactly as the caller submitted it and report
 * their outcome as a {@link https://developer.mozilla.org/docs/Web/API/Response `Response`}, streaming the body as it
 * is asked for and reporting failures as an unsuccessful status rather than as a thrown error: status handling stays
 * with the consumer, whether the resource was retrieved from the network or from the local file system.
 *
 * Exchanges are relayed as they were submitted, without being normalised as a `Request` object, so that a request
 * carrying a body reaches its handler undisturbed.
 *
 * @param handlers The handlers to dispatch to, keyed by the lowercase scheme they serve, with no trailing colon
 *
 * @returns A {@link Middleware} wrapping a {@link Fetch} implementation with one routing every exchange targeting a
 *     registered scheme to its handler
 *
 * @throws {RangeError} If any key of `handlers` is not a well-formed lowercase URI scheme
 *
 * @example
 *
 * ```typescript
 * const archives = createFetch(protocol({ file: file() }), transport(fetch));
 *
 * const fetcher = createFetch(throttle(), protocol({ file: file(), zip: zip(archives, unzip) }), transport(fetch));
 * ```
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-3.1 RFC 3986 § 3.1 - Scheme}
 */
function protocol(handlers: Readonly<Record<string, Fetch>>): Middleware {

	const malformed = Object.keys(handlers).find(scheme => !SchemePattern.test(scheme));

	if ( malformed !== undefined ) {
		throw new RangeError(`malformed scheme <${malformed}>`);
	}

	const registry = new Map(Object.entries<Fetch>(handlers)); // a map has no inherited keys to be mistaken for a scheme

	return fetcher => (input, init) => {

		const url = input instanceof Request ? input.url : input.toString();
		const handler = registry.get(scheme(url));

		if ( handler ) {

			return handler(input, init);

		} else {

			return fetcher(input, init);

		}


		/**
		 * Reports the lowercase scheme of a URL, or the empty string if it states none.
		 */
		function scheme(url: string): string {

			return url.slice(0, Math.max(0, url.indexOf(":"))).toLowerCase();

		}

	};

}


/**
 * Creates a `file` protocol handler.
 *
 * The generated handler retrieves local files, reporting their content as it is asked for, so that files of any size
 * are handled without holding them in memory; a consumer that stops early closes the underlying descriptor.
 *
 * The target is probed before the response is reported, so that a file that cannot be read is known as an unsuccessful
 * status rather than as an error thrown while the body is being consumed: a missing file is reported as `404`, an
 * unreadable one and a directory as `403`, a malformed `file` URL as `400`. Requests other than `GET` and `HEAD` are
 * refused as `405`.
 *
 * @returns A {@link Fetch} implementation serving the `file` scheme
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc8089 RFC 8089 - The "file" URI Scheme}
 */
function file(): Fetch {

	return async (input, init) => {

		const { method, url } = target(input, init);

		if ( method !== "GET" && method !== "HEAD" ) { // a local file is read-only
			return new Response(null, { status: 405, headers: { "Allow": "GET, HEAD" } });
		}

		try {

			const path = fileURLToPath(url);
			const stats = await stat(path);

			if ( stats.isDirectory() ) {

				return new Response(null, { status: 403 });

			} else {

				const headers = {

					"Content-Length": String(stats.size),
					"Last-Modified": new Date(stats.mtimeMs).toUTCString(),
					"Content-Location": url

				};

				return method === "HEAD" ? new Response(null, { headers }) : new Response(body(path), { headers });

			}

		} catch ( error ) {

			return new Response(null, { status: status(error) });

		}


		/**
		 * Reports the content of a file as a stream reading from it as chunks are asked for.
		 *
		 * The platform `ReadableStream` is assembled by hand, rather than through `Readable.toWeb()`, as the stream
		 * types of `node:stream/web` and the ones `Response` is defined against are structurally incompatible.
		 */
		function body(path: string): ReadableStream {

			const chunks = createReadStream(path)[Symbol.asyncIterator]();

			return new ReadableStream({

				async pull(controller) {

					const { done, value } = await chunks.next();

					if ( done ) {

						controller.close();

					} else {

						controller.enqueue(value);

					}

				},

				async cancel() {

					await chunks.return?.();

				}

			});

		}

		/**
		 * Reports the status a file system error is to be relayed as.
		 */
		function status(error: unknown): number {

			const code = error instanceof Error && "code" in error ? error.code : undefined;

			if ( code === "ENOENT" || code === "ENOTDIR" ) {

				return 404;

			} else if ( code === "EACCES" || code === "EPERM" ) {

				return 403;

			} else if ( typeof code === "string" && code.startsWith("ERR_INVALID") ) {

				return 400;

			} else {

				return 500;

			}

		}

	};

}


/**
 * Entry extraction function.
 *
 * Reports the content of the `entry` of a zip `archive`, or `undefined` if the archive states no such entry.
 */
type Unzip = (archive: Uint8Array<ArrayBuffer>, entry: string) => Uint8Array<ArrayBuffer> | undefined;

/**
 * Creates a `zip` protocol handler.
 *
 * The generated handler serves the entries of zip archives, addressed as the archive URL followed by the entry path,
 * separated by `!/`, as in `zip:file:///data/isced.zip!/concepts.csv`.
 *
 * Archives are retrieved through `archives`, so that an archive is reached wherever it is stored and through whatever
 * middlewares that client is assembled with; the outcome of an unsuccessful retrieval is relayed to the caller as it
 * was reported. A URL stating no `!/` separator is refused as `400`, an entry the archive doesn't state as `404`, and
 * requests other than `GET` and `HEAD` as `405`.
 *
 * > [!WARNING]
 * > The archive is held in memory while the entry is extracted, so archives are to be kept to a size the process can
 * > afford.
 *
 * @param archives The {@link Fetch} implementation to retrieve archives through
 * @param unzip The function to extract entries with
 *
 * @returns A {@link Fetch} implementation serving the `zip` scheme
 *
 * @see {@link https://pkware.cachefly.net/webdocs/APPNOTE/APPNOTE-6.3.9.TXT APPNOTE 6.3.9 - .ZIP File Format
 *     Specification}
 */
function zip(archives: Fetch, unzip: Unzip): Fetch {

	return async (input, init) => {

		const { method, url } = target(input, init);
		const separator = url.indexOf("!/");

		if ( method !== "GET" && method !== "HEAD" ) { // an archive entry is read-only
			return new Response(null, { status: 405, headers: { "Allow": "GET, HEAD" } });
		}

		if ( separator < 0 ) {

			return new Response(null, { status: 400 });

		} else {

			const response = await archives(url.slice(url.indexOf(":")+1, separator));

			if ( !response.ok ) {

				return response;

			} else {

				const entry = unzip(new Uint8Array(await response.arrayBuffer()), url.slice(separator+2));

				if ( entry === undefined ) {

					return new Response(null, { status: 404 });

				} else {

					return new Response(method === "HEAD" ? null : entry, {

						headers: {

							"Content-Length": String(entry.length),
							"Content-Location": url

						}

					});

				}

			}

		}

	};

}


/**
 * Reports the method and the target URL of an exchange, as submitted to a {@link Fetch} implementation.
 */
function target(input: string | URL | Request, init?: RequestInit): { readonly method: string, readonly url: string } {

	return {

		method: (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase(),
		url: input instanceof Request ? input.url : input.toString()

	};

}
