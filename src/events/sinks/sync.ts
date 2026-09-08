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
import { validate } from "@/_/gear-store/validate.js";
import { createEventId, EventShape, isStaleEvent } from "@/events/index.js";
import { convert } from "@/events/tasks/convert.js";
import { extract } from "@/events/tasks/extract.js";
import { universities } from "@/universities/index.js";
import { assert, isDefined } from "@metreeca/core";
import { difference } from "@metreeca/core/arrays";
import type { IRI } from "@metreeca/core/resource";
import { pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toSet } from "@metreeca/flow/sinks";
import { drain, filter, fork, map, tee } from "@metreeca/flow/tasks";
import { fetch, type URLLike } from "@metreeca/gear-url";
import { focus, html, untag } from "@metreeca/gear-xml";
import { log } from "@metreeca/tape";


const Concurrency = 10; // the number of pages fetched at the same time from the source site
const Survival = 0.75; // the smallest share of the stored events a single run must leave in place


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function sync(publisher: { // !!! persist

	readonly id: IRI
	readonly university: IRI

}): Sink<URLLike, Tally> {

	const university = assert(universities[publisher.university], isDefined,
		`unknown publisher university <${publisher.university}>`
	);

	return urls => pipe(
		(items(urls))
		(tee(
			insert(),
			remove()
		))
		(persist(EventShape))
	);


	function insert(): Task<URLLike, Delta> {

		return urls => {

			const digests = fingerprints(publisher);

			return pipe(
				(items(urls))
				(fork(Concurrency, pages => pipe(
					(pages)
					(fetch())
					(html())
					(focus())
					(untag())
					(filter(async page => !(await digests).has(digest(page))))
					(extract())
					(convert(university))
					(validate(EventShape))
					(map(event => isStaleEvent(event) ? delta(event.id) : delta(event.id, event)))
				)))
			);

		};

	}

	function remove(): Task<URLLike, Delta> {

		return urls => {

			const stored = catalogue(university);

			return pipe(
				(items(urls))
				(map(createEventId))
				(drain(async ids => {

					const [present, current] = await Promise.all([stored, ids(toSet())]);

					const removed = difference([present, current]);

					const surviving = present.length-removed.length;
					const required = Math.ceil(present.length*Survival);

					if ( surviving < required ) {

						logger.warning`skipping removal of <${removed.length}> events to keep at least <${required}>`;

						return [];

					} else {

						logger.info`removing <${removed.length}> of <${present.length}> stored events`;

						return removed;

					}

				}))
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

async function catalogue(university: {

	readonly id: IRI

}): Promise<readonly IRI[]> {

	return []; // !!! query the store, through `service(createStore)`, for the events published by `university`

}
