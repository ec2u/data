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

import type { RequestHandler } from "express";


/**
 * Keeps search engines away from every environment but production.
 *
 * Responses served by any environment other than `main` carry an `X-Robots-Tag: noindex` header, so that staging and
 * development addresses never surface in search results; production responses are left untouched.
 *
 * @param environment The environment the server runs in, as named by `DATA_ENVIRONMENT`
 *
 * @returns A handler to install ahead of every route
 */
export function robots(environment: string): RequestHandler {
	return environment === "main"
		? (_request, _response, next) => next()
		: (_request, response, next) => {
			response.set("X-Robots-Tag", "noindex");
			next();
		};
}
