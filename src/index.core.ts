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

import { gcp } from "@/_/gcp/index.js";
import { bind, executor, service } from "@metreeca/flow";
import { createCache, createFileCache } from "@metreeca/flow/cache";
import { getPackage, getPath } from "@metreeca/flow/space";
import { createVault } from "@metreeca/flow/vault";
import { createFetch, type Middleware } from "@metreeca/http";
import { cache } from "@metreeca/http/cache";
import { log } from "@metreeca/tape";
import { createGCPVault } from "./_/gcp/secrets.js";
import { clip } from "@metreeca/core/strings";


const logger = log(import.meta.url);


export const execute = executor(
	bind(getPath, () => gcp.production? getPath() : getPackage(import.meta.dirname)),
	bind(createVault, createGCPVault),
	bind(createCache, () => createFileCache({ bytes: 1024**3 })),
	bind(createFetch, () => createFetch(logging(cache({ store: service(createCache) }))))
);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Decorates a caching middleware with hit logging.
 *
 * Reports the exchanges the decorated middleware answers from its store, as stated by the `Cache-Status` header field
 * of the response, so that hits are reported against the target of the exchange rather than against an opaque storage
 * key. Exchanges answered by the origin server are left unreported.
 *
 * @param middleware The caching middleware whose hits are to be logged
 *
 * @returns A middleware relaying exchanges to `middleware`, logging the ones answered from its store
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9211 RFC 9211 - The Cache-Status HTTP Response Header Field}
 */
function logging(middleware: Middleware): Middleware {

	return fetch => {

		const delegate = middleware(fetch);

		return async (input, init) => {

			const response = await delegate(input, init);

			if ( hit(response) ) {

				const method = input instanceof Request ? input.method : init?.method ?? "GET";
				const target = clip(input instanceof Request ? input.url : input.toString(), 80);

				logger.info`${method} ${target} >> ${response.status} Retrieved From Cache`;

			}

			return response;

		};

	};

	function hit({ headers }: Response): boolean {

		return (headers.get("cache-status") ?? "")
			.split(";").slice(1) // drop the identity of the cache, which opens the field value
			.some(parameter => parameter.trim() === "hit");

	}

}
