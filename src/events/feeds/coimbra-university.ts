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

import { translate } from "@/_/muse/translator/translate.js";
import { execute } from "@/index.core.js";
import { pipe } from "@metreeca/flow";
import { items, range } from "@metreeca/flow/feeds";
import { each } from "@metreeca/flow/sinks";
import { flat, fork, map, take } from "@metreeca/flow/tasks";
import { jpath, json, number, string } from "@metreeca/gear-json";
import { crawl, fetch } from "@metreeca/gear-url";
import { focus, html, untag } from "@metreeca/gear-xml";


const en = "en";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const Search = "https://content.fw.uc.pt/v1/agenda/events/search";
const Events = "https://agenda.coimbra.pt/event";


if ( import.meta.main ) {
	await execute(sync);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function sync() {

	return pipe(
		(items(Search))
		(crawl(
			fork(10, urls => pipe(
				items(urls)
				(fetch())
				(json())
				(jpath())
			)),
			path => pipe(
				items(path("pagination.total_pages"))
				(map(number))
				(flat(map(total => range(2, total+1))))
				(map(index => `${Search}?page=${index}`))
			),
			path => pipe(
				items(path("events.*.key"))
				(map(string))
				(map(key => `${Events}/${key}`))
			)
		))
		(take(1))
		(fork(10, urls => pipe(
			(items(urls))
			(fetch())
			(html())
			(focus())
			(untag())
			(translate(en))
		)))
		(each(console.log))
	);

}


// !!! incremental sync
// !!! analysis
// !!! mapping
// !!! validation
// !!! storage
