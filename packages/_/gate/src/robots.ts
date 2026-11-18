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
 * Search engine indexing control for services reachable under several addresses.
 *
 * @module
 */

import type { URLLike } from "@metreeca/core";
import type { RequestHandler } from "express";


/**
 * Keeps search engines on the canonical address of a service.
 *
 * Responses to requests for any host other than that of `base` carry an `X-Robots-Tag: noindex` header, so that
 * staging and development deployments, platform addresses and the alternate names of production never surface in
 * search results; responses served on the canonical host are left untouched and indexed as usual.
 *
 * @param base The canonical address of the service, whose host alone may be indexed
 *
 * @returns A handler to install ahead of every route
 */
export function robots(base: URLLike): RequestHandler {

	const canonical = new URL(base).hostname;

	return (request, response, next) => {

		if ( request.hostname !== canonical ) {
			response.set("X-Robots-Tag", "noindex");
		}

		next();

	};

}
