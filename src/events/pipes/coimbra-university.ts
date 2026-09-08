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
import { type Delta, persist } from "@/_/gear-store/persist.js";
import { event, EventShape, isStale } from "@/events/index.js";
import { convert } from "@/events/tasks/convert.js";
import { extract } from "@/events/tasks/extract.js";
import { execute } from "@/index.core.js";
import { universities } from "@/universities/index.js";
import { difference } from "@metreeca/core/arrays";
import type { IRI } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/structures";
import { type Feed, pipe, type Task } from "@metreeca/flow";
import { items, range } from "@metreeca/flow/feeds";
import { toSet } from "@metreeca/flow/sinks";
import { filter, flat, fork, map, tee } from "@metreeca/flow/tasks";
import { jpath, json, number, string, validate } from "@metreeca/gear-json";
import { crawl, fetch } from "@metreeca/gear-url";
import { focus, html, untag } from "@metreeca/gear-xml";
import { log } from "@metreeca/tape";


const Search = "https://content.fw.uc.pt/v1/agenda/events/search";
const Events = "https://agenda.coimbra.pt/event";

const Publisher = immutable({

	id: "https://www.uc.pt/dri/noticias/eventos",
	university: universities.coimbra.id,

	prefLabel: "Coimbra Agenda"

});


const Concurrency = 10;
const Floor = 0.10; // the share of the stored events a single run is allowed to retract


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const logger = log(import.meta.url);


if ( import.meta.main ) {
	execute(CoimbraUniversity);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// !!! incremental sync
// !!! validation
// !!! storage

export async function CoimbraUniversity() {

	return pipe(
		(items(Search))
		(crawl(
			fork(Concurrency, urls => pipe(
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

// the digest skip lives inside the branch, so `remove` still sees the whole scan

function insert(university: {

	readonly id: IRI
	readonly zone: string

}): Task<string | URL, Delta> {

	const digests = new Map<string, Digest>;  // !!! populate from store, keyed by source page URL

	return urls => pipe(
		items(urls)
		(fork(Concurrency, flat(map(url => pipe( // a pipe per page keeps the source URL in scope as the digest key
			(items([url]))
			(fetch())
			(html())
			(focus())
			(untag())
			(filter(page => digests.get(String(url)) !== digest(page)))
			(extract())
			(convert(university))
			(validate(v => undefined) /* !!! */)
			(map(event => [event.id, isStale(event) ? null : event] satisfies Delta))
		)))))
	);

}

function remove(university: {

	readonly id: IRI

}): Task<string | URL, Delta> {

	return urls => items(retract(urls))(flat());


	async function retract(urls: Feed<string | URL>): Promise<Feed<Delta>> {

		const current = await catalogue(university);
		const present = await pipe(items(urls)(map(event))(toSet()));

		const removed = difference([current, present]);

		if ( removed.length > current.length*Floor ) {

			throw new Error(`exceeded retraction floor <${Floor}>`
				+` with <${removed.length}> of <${current.length}> events`
			);

		} else {

			logger.info`retracting <${removed.length}> of <${current.length}> events`;

			return items(removed.map(id => [id, null] satisfies Delta));

		}

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function catalogue(university: {

	readonly id: IRI

}): Promise<readonly IRI[]> {

	return []; // !!! query the store, through `service(createStore)`, for the events published by `university`

}
