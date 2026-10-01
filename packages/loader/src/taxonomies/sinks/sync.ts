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

import { getTopicId, Taxonomy, Topic } from "@ec2u/data-shared/taxonomies/index.js";
import type { URLLike } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toSet } from "@metreeca/flow/sinks";
import { filter, flat, fork, map, tee, trim } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { csv, type Record } from "@metreeca/mime-csv";
import { fetch } from "@metreeca/pipe-url";
import { digest } from "@metreeca/work/pipe-store/_digest.js";
import { createStore } from "@metreeca/work/pipe-store/index.js";
import { delta, type Delta, persist, type Tally } from "@metreeca/work/pipe-store/persist.js";
import { retire } from "@metreeca/work/pipe-store/retire.js";
import { validate } from "@metreeca/work/pipe-store/validate.js";
import { convert, getPath } from "../tasks/convert.js";
import { select } from "@metreeca/work/pipe-store/select.js";


const survival = 0.75; // the smallest fraction of the stored topics a document must account for // !!! as option

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
 * holds is dropped before it is converted, so an unchanged document costs a retrieval and a comparison per entry;
 * under `force` every entry is converted and stated afresh, whatever the store holds, so a topic whose conversion
 * changed without its entry changing is brought back in line.
 *
 * Conversions run concurrently, one for every entry left to convert, so a document costs about as long as its slowest
 * entry rather than the sum of them all. The embedding each conversion requests is paced by the quota throttle the
 * Gemini client carries, so the run keeps within the published rate however many entries it opens at once.
 *
 * The taxonomy is stated as it is handed over, alongside the topics and under the same transaction, so a scheme is
 * described wherever its topics are held.
 *
 * Topics are named after the entries the document lists and stated as they are drawn. The ones the store holds for
 * the taxonomy and the document never named are retracted once it has been read whole, so nothing is retired on the
 * strength of a partial reading. A document listing fewer than three quarters of the stored topics states nothing and
 * fails, so a truncated or unreachable document costs a run rather than the taxonomy, while one that renames its
 * topics wholesale is published as it stands.
 *
 * @param taxonomy The taxonomy the topics are attributed to
 * @param taxonomy.id The identifier of the concept scheme the topics belong to
 *
 * @param force Whether every entry is stated afresh, ignoring the digests recorded with the stored topics; defaults
 * to `false`
 *
 * @returns A sink retrieving a feed of CSV documents and resolving to a tally of what it did
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if the run would leave in place less than three
 * quarters of the stored topics, or if the store rejects a topic as invalid, with nothing committed
 *
 * @throws {@link !Error Error} While the feed is consumed, if any write fails, with nothing committed
 */
export function sync(taxonomy: Taxonomy, force = false): Sink<URLLike, Tally> {

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

			const digests = force ? new Set<string>() : pipe(
				(select({

					entry: taxonomy.id,
					shape: Taxonomy,
					model: { resources: { digest: {} } }

				}))
				(map(topic => topic.digest))
				(toSet())
			);

			return pipe(
				(items(records))
				(filter(async record => !(await digests).has(digest(record))))
				(fork(0, convert(taxonomy)))
				(validate(Topic))
				(map(topic => delta(topic.id, Topic, topic)))
			);

		};

	}

	function remove(): Task<Record, Delta> {

		return records => {

			const existing = select({

				entry: taxonomy.id,
				shape: Taxonomy,
				model: { resources: {} }

			});

			return pipe(
				(items(records))
				(map(record => getTopicId(taxonomy, getPath(record))))
				(retire({ atomic: true, survival, existing }))
				(map(id => delta(id, Topic, null)))
			);

		};

	}

}
