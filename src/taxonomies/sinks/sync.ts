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
import { Topic } from "@/taxonomies/index.js";
import { convert, createTopicId } from "@/taxonomies/tasks/convert.js";
import { difference } from "@metreeca/core/arrays";
import type { IRI } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/structures";
import { pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toSet } from "@metreeca/flow/sinks";
import { drain, filter, map, tee } from "@metreeca/flow/tasks";
import { csv, type Record } from "@metreeca/gear-csv";
import { fetch, type URLLike } from "@metreeca/gear-url";
import { log } from "@metreeca/tape";


const Survival = 0.75; // the smallest share of the stored topics a single run must leave in place

const CSVFormat = immutable({

	header: true,
	skip: true,
	trim: true

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a sink replacing a taxonomy as a whole.
 *
 * The document is retrieved and its topics committed under a single store transaction, so the taxonomy is never half
 * published: a failing write, a refused retraction or a parse dying part way leaves the store exactly as it was and
 * the next run simply starts over. An entry whose digest matches the one recorded with the topic the store already
 * holds is dropped before it is converted, so an unchanged document costs a retrieval and a comparison per entry.
 *
 * Topics are named after the entries the document lists and stated as they are drawn. The ones the store holds for
 * the taxonomy and the document never named are retracted once it has been read whole, so nothing is retired on the
 * strength of a partial reading. A run retracting more than a quarter of the stored topics states nothing and fails,
 * leaving a truncated, misserved or unreachable document to cost a run rather than the taxonomy.
 *
 * @param taxonomy The taxonomy the topics are attributed to
 * @param taxonomy.id The identifier of the concept scheme the topics belong to
 *
 * @returns A sink retrieving a feed of CSV documents and resolving to a tally of what it did
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if the run would leave in place less than three
 * quarters of the stored topics, or if the store rejects a topic as invalid, with nothing committed
 *
 * @throws {@link !Error Error} While the feed is consumed, if any write fails, with nothing committed
 */
export function sync(taxonomy: { // !!! persists whole taxonomy

	readonly id: IRI

}): Sink<URLLike, Tally> {

	return urls => pipe(
		(items(urls))
		(fetch())
		(csv(CSVFormat))
		(tee(
			insert(),
			remove()
		))
		(persist(Topic, { atomic: true }))
	);


	function insert(): Task<Record, Delta> {

		return records => {

			const digests = fingerprints(taxonomy);

			return pipe(
				(items(records))
				(filter(async record => !(await digests).has(digest(record))))
				(convert(taxonomy))
				(validate(Topic))
				(map(topic => delta(topic.id, topic)))
			);

		};

	}

	function remove(): Task<Record, Delta> {

		return records => {

			const stored = catalogue(taxonomy);

			return pipe(
				(items(records))
				(map(record => createTopicId(taxonomy, record)))
				(drain(async ids => {

					const [present, current] = await Promise.all([stored, ids(toSet())]);

					const removed = difference([present, current]);
					const allowed = present.length-Math.ceil(present.length*Survival);

					// a wholesale retraction is refused outright: under a transaction the throw takes the
					// insertions down with it, leaving the taxonomy as the last sound run left it

					if ( removed.length > allowed ) {

						throw new RangeError(`exceeded removal limit of <${allowed}> topics`
							+` with <${removed.length}> of <${present.length}> stored ones`
						);

					} else {

						logger.info`removing <${removed.length}> of <${present.length}> stored topics`;

						return removed;

					}

				}))
				(map(id => delta(id)))
			);

		};

	}

}


//// !!! ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function fingerprints(taxonomy: {

	readonly id: IRI

}): Promise<ReadonlySet<Digest>> {

	return new Set(); // !!! query the store, through `service(createStore)`, for the digests of the `taxonomy` entries

	// !!! record each digest alongside its topic, so that only a committed state justifies skipping it

}

async function catalogue(taxonomy: {

	readonly id: IRI

}): Promise<readonly IRI[]> {

	return []; // !!! query the store, through `service(createStore)`, for the topics of `taxonomy`

}
