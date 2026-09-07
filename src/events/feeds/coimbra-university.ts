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

import { createStore } from "@/_/gear-store/index.js";
import { EventShape } from "@/events/index.js";
import { convert } from "@/events/tasks/convert.js";
import { extract } from "@/events/tasks/extract.js";
import { execute } from "@/index.core.js";
import { universities } from "@/universities/index.js";
import type { Markdown } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/structures";
import { type Feed, pipe, type Sink } from "@metreeca/flow";
import { items, range } from "@metreeca/flow/feeds";
import { each } from "@metreeca/flow/sinks";
import { filter, flat, fork, map, peek, take } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { jpath, json, number, string, validate } from "@metreeca/gear-json";
import { crawl, fetch } from "@metreeca/gear-url";
import { focus, html, untag } from "@metreeca/gear-xml";
import { Reference } from "@metreeca/qest";
import type { Resource } from "@metreeca/qest/resource";
import { createHash } from "node:crypto";


const Search = "https://content.fw.uc.pt/v1/agenda/events/search";
const Events = "https://agenda.coimbra.pt/event";

const Publisher = immutable({

	id: "https://www.uc.pt/dri/noticias/eventos",
	university: universities.coimbra.id,

	prefLabel: "Coimbra Agenda"

});


if ( import.meta.main ) {
	await execute(sync);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// !!! incremental sync
// !!! storage

export async function sync() {

	return pipe(
		(items([asserted(), retracted()]))
		(flat()) // the crawl must run dry before an entry can be told stale
			(delta())
	);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function asserted(): Feed<Delta> {

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
		(take(1) /* !!! */)
		(fork(10, urls => pipe(
			(items(urls))
			(fetch())
			(html())
			(focus())
			(untag())
			(filter(changed))
			(extract())
			(peek(console.log))
			(convert(universities.coimbra))
			(peek(console.log))
			(validate(v => undefined) /* !!! */)
			(map(event => [event.id, event] satisfies Delta))
		)))
	);

}


function retracted(): Feed<Delta> {

	return items<Delta>([]); // !!! retract every recorded entry the crawl didn't visit

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Delta = [
	entry: Reference,
	state: null | Resource
]


async function changed(page: Markdown): Promise<boolean> {

	return unknown(createHash("sha256").update(page).digest("hex"));


	async function unknown(digest: string): Promise<boolean> {

		return true; // !!! test `digest` against the recorded page digests, recording it if unknown

	}

}


function delta(): Sink<Delta> {

	const store = service(createStore);

	return feed => {

		const entries = new Set<Reference>();

		return store.execute(client => feed(each(([entry, state]) => {

			if ( entries.has(entry) ) {
				throw new RangeError(`duplicate entry <${entry}>`);
			}

			entries.add(entry);

			return state === null
				? client.remove({ entry, shape: EventShape })
				: client.insert({ entry, shape: EventShape, state });

		})));

	};

}
