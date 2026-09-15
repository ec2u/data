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
import { Dataset } from "@/datasets/index.js";
import { Event, events, getEventId, isStaleEvent, Publisher } from "@/events/index.js";
import { classify } from "@/events/tasks/classify.js";
import { convert } from "@/events/tasks/convert.js";
import { extract } from "@/events/tasks/extract.js";
import { getUniversity } from "@/universities/index.core.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, resource } from "@metreeca/blue/resource";
import { pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toSet } from "@metreeca/flow/sinks";
import { filter, flat, fork, map, peek, tee } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { fetch, type URLLike } from "@metreeca/gear-url";
import { focus, html, untag } from "@metreeca/gear-xml";


const retrieval = 10; // the number of pages fetched at the same time from the source site // !!! as option
const analysis = 25; // the number of pages analysed at the same time by the model // !!! as option
const survival = 0.75; // the smallest fraction of the stored events a single run must leave in place // !!! as option


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function sync(publisher: Publisher, force = false): Sink<URLLike, Tally> {

	const store = service(createStore);

	const university = getUniversity(publisher.university);

	return urls => pipe(
		(items(urls))
		(tee(
			define(),
			insert(),
			remove()
		))
		(persist())
	);


	function define(): Task<URLLike, Delta> {

		return () => pipe(
			(items([publisher]))
			(validate(Publisher))
			(map(publisher => delta(publisher.id, Publisher, publisher)))
		);

	}

	function insert(): Task<URLLike, Delta> {

		return urls => {

			const digests = force ? new Set<string>() : pipe( // !!! replace with select()
				(items(store.lookup({

					entry: events.id,
					shape: Events,

					model: { resources: [{ digest: "" }, { "?university": [university.id] }] }

				})))
				(flat(map(stated => items(stated?.resources ?? [])))) // !!! remove
					(map(event => event.digest))
					(toSet())
			);

			return pipe(
				(items(urls))
				(fork(retrieval, pages => pipe( // retrievals are capped out of courtesy to the source site
					(items(pages))
					(fetch())
					(html())
					(focus())
					(untag())
					(filter(async page => !(await digests).has(digest(page))))
				)))
				(fork(analysis, pages => pipe( // analyses are capped on the tool sessions they hold, not on the rate
					(items(pages))
					(extract())
					(classify())
					(convert(university))
					(peek(console.log)) // !!!
					(validate(Event))
					(map(event => isStaleEvent(event)
						? delta(event.id, Event)
						: delta(event.id, Event, event)
					))
				)))
			);

		};

	}

	function remove(): Task<URLLike, Delta> {

		return urls => {

			const existing = pipe( // !!! replace with select()
				(items(store.lookup({

					entry: events.id,
					shape: Events,

					model: { resources: ["", { "?university": [university.id] }] }

				})))
				(flat(map(stated => items(stated?.resources ?? [])))) // !!! remove
			);

			return pipe(
				(items(urls))
				(map(getEventId))
				(retire({ survival, existing }))
				(map(id => delta(id, Event)))
			);

		};

	}

}


//// !!! Remove ////////////////////////////////////////////////////////////////////////////////////////////////////////

function Events() {
	return resource(Dataset, {

		resources: multiple(reference(Event))

	});
}
