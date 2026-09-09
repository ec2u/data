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

import { digest, type Digest } from "@/_/gear-store/_digest.js";
import { delta, type Delta, persist, type Tally } from "@/_/gear-store/persist.js";
import { retire } from "@/_/gear-store/retire.js";
import { validate } from "@/_/gear-store/validate.js";
import { createEventId, Event, isStaleEvent } from "@/events/index.js";
import { convert } from "@/events/tasks/convert.js";
import { extract } from "@/events/tasks/extract.js";
import { partners } from "@/universities/index.js";
import { assert, isDefined } from "@metreeca/core";
import type { IRI } from "@metreeca/core/resource";
import { pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { filter, fork, map, tee } from "@metreeca/flow/tasks";
import { fetch, type URLLike } from "@metreeca/gear-url";
import { focus, html, untag } from "@metreeca/gear-xml";


const concurrency = 10; // the number of pages fetched at the same time from the source site // !!! as option
const attrition = 0.25; // the largest fraction of the stored events a single run may remove // !!! as option


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function sync(publisher: { // !!! persist publisher

	readonly id: IRI
	readonly university: IRI

}): Sink<URLLike, Tally> {

	const university = assert(partners[publisher.university], isDefined,
		`unknown publisher university <${publisher.university}>`
	);

	return urls => pipe(
		(items(urls))
		(tee(
			insert(),
			remove()
		))
		(persist(Event))
	);


	function insert(): Task<URLLike, Delta> {

		return urls => {

			const digests = fingerprints(publisher);

			return pipe(
				(items(urls))
				(fork(concurrency, pages => pipe(
					(pages)
					(fetch())
					(html())
					(focus())
					(untag())
					(filter(async page => !(await digests).has(digest(page))))
					(extract())
					(convert(university))
					(validate(Event))
					(map(event => isStaleEvent(event) ? delta(event.id) : delta(event.id, event)))
				)))
			);

		};

	}

	function remove(): Task<URLLike, Delta> {

		return urls => {

			const existing = catalogue(university);

			return pipe(
				(items(urls))
				(map(createEventId))
				(retire({ attrition, existing }))
				(map(id => delta(id)))
			);

		};

	}

}


//// !!! ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function fingerprints(publisher: {

	readonly id: IRI

}): Promise<ReadonlySet<Digest>> {

	return new Set(); // !!! query the store, through `service(createStore)`, for the digests of the `publisher` pages

}

async function* catalogue(university: {

	readonly id: IRI

}): AsyncGenerator<IRI> {

	// !!! query the store, through `service(createStore)`, for the events published by `university`

}
