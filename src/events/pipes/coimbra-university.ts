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

import { digest, type Digest } from "@/_/gear-store/digest.js";
import { createStore } from "@/_/gear-store/index.js";
import { type Delta, persist } from "@/_/gear-store/persist.js";
import { EventShape, isStale } from "@/events/index.js";
import { convert } from "@/events/tasks/convert.js";
import { extract } from "@/events/tasks/extract.js";
import { execute } from "@/index.core.js";
import { universities } from "@/universities/index.js";
import { difference } from "@metreeca/core/arrays";
import { IRI } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/structures";
import { pipe, type Task } from "@metreeca/flow";
import { items, range } from "@metreeca/flow/feeds";
import { filter, flat, fork, map, peek, tee } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { jpath, json, number, string, validate } from "@metreeca/gear-json";
import { crawl, fetch } from "@metreeca/gear-url";
import { focus, html, untag } from "@metreeca/gear-xml";


const Search = "https://content.fw.uc.pt/v1/agenda/events/search";
const Events = "https://agenda.coimbra.pt/event";

const Publisher = immutable({

	id: "https://www.uc.pt/dri/noticias/eventos",
	university: universities.coimbra.id,

	prefLabel: "Coimbra Agenda"

});


if ( import.meta.main ) {
	execute(CoimbraUniversity);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// !!! incremental sync
// !!! storage


export async function CoimbraUniversity() {

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
		(tee(
			insert(universities.coimbra),
			remove(universities.coimbra)
		))
		(persist(EventShape))
	);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function insert(university: {

	readonly id: IRI
	readonly zone: string

}): Task<string | URL, Delta> {

	throw new Error(";( to be implemented"); // !!!

}


function remove(university: {

	readonly id: IRI
	readonly zone: string

}): Task<string | URL, Delta> {

	const store = service(createStore);

	const current = new Set(); // !!! current event catalogue from store
	const present = new Set(); // !!! updated event catalogue incrementally built from feed


	const removed = difference([current, present]);

	// !!! sanity checks and logging

	throw new Error(";( to be implemented"); // !!! emit removal deltas

}


//// !!! ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function harvest(university: {

	readonly id: IRI
	readonly zone: string

}): Task<string | URL, Delta> {

	const digests = new Map<string, Digest>;  // !!! populate from the store, keyed by source page URL (paging?)

	return urls => pipe(
		items(urls)
		(fork(10, flat(map(url => pipe( // a pipe per page keeps the source URL in scope as the digest key
			(items([url]))
			(fetch())
			(html())
			(focus())
			(untag())
			(filter(page => digests.get(String(url)) !== digest(page)))
			(extract())
			(peek(console.log) /* !!! */)
			(convert(university))
			(peek(console.log) /* !!! */)
			(validate(v => undefined) /* !!! */)
			(map(event => [event.id, isStale(event) ? null : event] satisfies Delta))
		)))))
	);

}
