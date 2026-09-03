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

import { execute } from "@/index.core.js";
import { optional, required } from "@metreeca/core/arrays";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { each, toArray } from "@metreeca/flow/sinks";
import { service } from "@metreeca/gear";
import { jpath, json, number, string } from "@metreeca/gear-json";
import { crawl, fetch } from "@metreeca/gear-url";
import { createCache } from "@metreeca/gear/cache";
import { cache } from "@metreeca/http/cache";


const Search = "https://content.fw.uc.pt/v1/agenda/events/search";
const Events = "https://agenda.coimbra.pt/event";

const Freshness = 3_600; // seconds


if ( import.meta.main ) {
	await execute(sync);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function sync() {

	return pipe(
		(items(Search))
		(crawl(
			async url => optional(await pipe(
				(items(url))

					// state the freshness the agenda API omits, so responses are cacheable

					(fetch(cache({ store: service(createCache) }), next => async (input, init) => {

						const response = await next(input, init);

						return new Response(response.body, {
							status: response.status,
							statusText: response.statusText,
							headers: new Headers([...response.headers, ["cache-control", `max-age=${Freshness}`]])
						});

					}))

					(json())
					(jpath())
					(toArray()) // !!! avoid
			)),
			path => {

				const current = required(path("pagination.current_page").map(number));
				const total = required(path("pagination.total_pages").map(number));

				return current < total ? `${Search}?page=${current+1}` : undefined;
			},
			path => path("events.*.key")
				.map(string)
				.map(key => `${Events}/${key}`)
		))
		(each(console.log))
	);

}
