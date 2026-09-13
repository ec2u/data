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
import { createEventId, Event, events, isStaleEvent, Publisher } from "@/events/index.js";
import { convert } from "@/events/tasks/convert.js";
import { extract } from "@/events/tasks/extract.js";
import { partners } from "@/universities/index.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, resource } from "@metreeca/blue/resource";
import type { Instance } from "@metreeca/blue/value";
import { assert, isDefined } from "@metreeca/core";
import { pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toSet } from "@metreeca/flow/sinks";
import { filter, flat, fork, map, tee } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { fetch, type URLLike } from "@metreeca/gear-url";
import { focus, html, untag } from "@metreeca/gear-xml";


const concurrency = 10; // the number of pages fetched at the same time from the source site // !!! as option
const survival = 0.75; // the smallest fraction of the stored events a single run must leave in place // !!! as option


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function sync(publisher: Instance<typeof Publisher>): Sink<URLLike, Tally> {

	const store = service(createStore);

	const university = assert(partners[publisher.university], isDefined,
		`unknown publisher university <${publisher.university}>`
	);

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

			const digests = pipe( // !!! replace with select()
				(items(store.lookup({

					entry: events.id,
					shape: Catalogue,

					model: { resources: [{ digest: "" }, { "?university": [university.id] }] }

				})))
				(flat(map(stated => items(stated?.resources ?? [])))) // !!! remove
				(map(event => event.digest))
				(toSet())
			);

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
					(map(event => isStaleEvent(event) ? delta(event.id, Event) : delta(event.id, Event, event)))
				)))
			);

		};

	}

	function remove(): Task<URLLike, Delta> {

		return urls => {

			const existing = pipe( // !!! replace with select()
				(items(store.lookup({

					entry: events.id,
					shape: Catalogue,

					model: { resources: ["", { "?university": [university.id] }] }

				})))
				(flat(map(stated => items(stated?.resources ?? [])))) // !!! remove
			);

			return pipe(
				(items(urls))
				(map(createEventId))
				(retire({ survival, existing }))
				(map(id => delta(id, Event)))
			);

		};

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Catalogue() { // the events dataset, drawing its members as the events they are
	return resource(Dataset, {

		resources: multiple(reference(Event))

	});
}

