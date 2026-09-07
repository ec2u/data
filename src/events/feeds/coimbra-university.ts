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
import { type Event, EventShape } from "@/events/index.js";
import { convert } from "@/events/tasks/convert.js";
import { extract } from "@/events/tasks/extract.js";
import { execute } from "@/index.core.js";
import { universities } from "@/universities/index.js";
import { immutable } from "@metreeca/core/structures";
import { pipe, type Sink, type Task } from "@metreeca/flow";
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
		(scan())
		(take(1) /* !!! */)
		(insert())
		(delta())
	);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function scan() {
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
	);
}

function insert(): Task<string|URL, Delta> {

	const store = service(createStore);

	const entries = new Set<Reference>;  // !!! populate from store
	const digests = new Set<Hash>;  // !!! populate from store

	return urls => items((async function* () {

		const inserted = pipe(
			items(urls)
			(fork(10, urls => pipe(
				(items(urls))
				(fetch())
				(html())
				(focus())
				(untag())
				(filter(page => !digests.has(digest(page))))
				(extract())
				(peek(console.log))
				(convert(universities.coimbra))
				(peek(console.log))
				(validate(v => undefined) /* !!! */)
				(map(event => [event.id, event] satisfies Delta))
			)))
		);

		for await (const insertion of inserted) {

			const [entry, state] = insertion;

			if ( !isStale(state) ) {

				entries.delete(entry);

				yield insertion;

			}

		}

		yield* [...entries].map((entry): Delta => [entry, null]); // whatever the crawl left unconfirmed is gone or stale

	})());


	function isStale(state: Event): boolean {
		return false; // !!!
	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Delta = [
	entry: Reference,
	state: null | Resource
]

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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Hash = string

function digest(data: string): Hash {

	return createHash("sha256").update(data).digest("hex");

}
