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

import { digest } from "@/_/gear-store/_digest.js";
import { createStore } from "@/_/gear-store/index.js";
import { delta, type Delta, persist, type Tally } from "@/_/gear-store/persist.js";
import { retire } from "@/_/gear-store/retire.js";
import { validate } from "@/_/gear-store/validate.js";
import { Taxonomy, Topic } from "@/taxonomies/index.js";
import { convert, createTopicId } from "@/taxonomies/tasks/convert.js";
import type { Instance } from "@metreeca/blue/value";
import { immutable } from "@metreeca/core/structures";
import { pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toSet } from "@metreeca/flow/sinks";
import { filter, flat, map, tee } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { csv, type Record } from "@metreeca/gear-csv";
import { fetch, type URLLike } from "@metreeca/gear-url";


const survival = 0.75; // the smallest fraction of the stored topics a single run must leave in place // !!! as option

const CSVFormat = immutable({

	header: true,
	skip: true,
	trim: true

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a sink replacing a taxonomy as a whole.
 *
 * The document is retrieved and its topics committed under a single store transaction, so the taxonomy is never half
 * published: a failing write, a refused retraction or a parse dying part way leaves the store exactly as it was and
 * the next run simply starts over. An entry whose digest matches the one recorded with the topic the store already
 * holds is dropped before it is converted, so an unchanged document costs a retrieval and a comparison per entry.
 *
 * The taxonomy is stated as it is handed over, alongside the topics and under the same transaction, so a scheme is
 * described wherever its topics are held.
 *
 * Topics are named after the entries the document lists and stated as they are drawn. The ones the store holds for
 * the taxonomy and the document never named are retracted once it has been read whole, so nothing is retired on the
 * strength of a partial reading. A run leaving in place less than three quarters of the stored topics states nothing
 * and fails, so a truncated, misserved or unreachable document costs a run rather than the taxonomy.
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
export function sync(taxonomy: Instance<typeof Taxonomy>): Sink<URLLike, Tally> {

	const store = service(createStore);


	return urls => pipe(
		(items(urls))
		(fetch())
		(csv(CSVFormat))
		(tee(
			define(),
			insert(),
			remove()
		))
		(persist({ atomic: true }))
	);


	function define(): Task<Record, Delta> {

		return () => pipe(
			(items([taxonomy]))
			(validate(Taxonomy))
			(map(taxonomy => delta(taxonomy.id, Taxonomy, taxonomy)))
		);

	}

	function insert(): Task<Record, Delta> {

		return records => {

			const digests = pipe(
				(items(store.lookup({ // !!! replace with select()

					entry: taxonomy.id,
					shape: Taxonomy,

					model: { resources: [{ digest: "" }] }

				})))
				(flat(map(stated => items(stated?.resources ?? [])))) // !!! remove
				(map(topic => topic.digest))
				(toSet())
			);

			return pipe(
				(items(records))
				(filter(async record => !(await digests).has(digest(record))))
				(convert(taxonomy))
				(validate(Topic))
				(map(topic => delta(topic.id, Topic, topic)))
			);

		};

	}

	function remove(): Task<Record, Delta> {

		return records => {

			const existing = pipe( // !!! replace with select()
				(items(store.lookup({

					entry: taxonomy.id,
					shape: Taxonomy,

					model: { resources: [""] }

				})))
				(flat(map(stated => items(stated?.resources ?? [])))) // !!! remove
			);

			return pipe(
				(items(records))
				(map(record => createTopicId(taxonomy, record)))
				(retire({ atomic: true, survival, existing }))
				(map(id => delta(id, Topic)))
			);

		};

	}

}
