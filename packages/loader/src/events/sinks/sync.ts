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

import { when } from "@metreeca/work/flow/when.js";
import { digest } from "@metreeca/work/tide-store/_digest.js";
import { createStore } from "@metreeca/work/tide-store/index.js";
import { delta, type Delta, persist, type Tally } from "@metreeca/work/tide-store/persist.js";
import { retire } from "@metreeca/work/tide-store/retire.js";
import { validate } from "@metreeca/work/tide-store/validate.js";
import { Dataset } from "@/datasets/index.js";
import { Event, events, getEventId, isStaleEvent, Publisher } from "@/events/index.js";
import { classify } from "@/events/tasks/classify.js";
import { convert } from "@/events/tasks/convert.js";
import { extract } from "@/events/tasks/extract.js";
import { University } from "@/universities/index.js";
import { base, Page } from "@/vocabularies/ec2u.js";
import { reference } from "@metreeca/blue/reference";
import { id, multiple, resource } from "@metreeca/blue/resource";
import type { Markdown } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { type Feed, pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toSet } from "@metreeca/flow/sinks";
import { filter, flat, fork, map, mix, tee } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { fetch, type URLLike } from "@metreeca/gear-url";
import { focus, html, untag } from "@metreeca/gear-xml";


const retrieval = 10; // the number of pages fetched at the same time from the source site // !!! as option
const analysis = 10; // the number of pages analysed at the same time by the model // !!! as option

const survival = 0.75; // the smallest fraction of the stored events a single run must leave in place // !!! as option


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function sync(publisher: Publisher, force = false): Sink<URLLike, Tally> {

	const store = service(createStore);

	// the city the university publishing the events is in, standing in as the locality of a venue a document names
	// no city for; a lookup answering nothing leaves the address to what the document itself states

	const city = store.lookup({ // !!! replace with select()

		entry: publisher.university,
		shape: University,

		model: { city: { label: "" } }

	})
		.then(university => university?.city?.label)
		.catch(() => undefined);


	return urls => pipe(
		(items(urls))
		(tee(
			insert(),
			delist()
		))
		(mix(
			define(),
			expire()
		))
		(persist())
	);


	function define(): Feed<Delta> {

		return pipe(
			(items([publisher]))
			(validate(Publisher))
			(map(publisher =>
				delta(publisher.id, Publisher, publisher)
			))
		);

	}

	function insert(): Task<URLLike, Delta> {

		return urls => {

			const digests = force ? new Set<string>() : pipe(
				(items(store.lookup({ // !!! replace with select()

					entry: base, // a virtual collection is gathered by class, so the entry is a placeholder
					shape: Pages,

					model: { pages: { digest: {}, "?source": [publisher.id] } }

				})))
				(flat(map(stated => items(stated?.pages ?? [])))) // !!! remove
					(map(page => page.digest))
					(toSet())
			);


			async function modified(page: Markdown) {
				return !(await digests).has(digest(page));
			}


			return pipe(urls
				(fork(retrieval, pages => pipe(
					(items(pages))
					(fetch())
					(html())
					(focus())
					(untag())
					(filter(modified))
				)))
				(fork(analysis, pages => pipe(
					(items(pages))
					(extract())
					(tee(
						payloads => pipe( // every page states its digest, so the crawl won't offer it again
							(items(payloads))
							(map(({ url, digest }) =>
								delta(url, Page, immutable({ id: url, source: publisher.id, digest }))
							))
						),
						payloads => pipe(
							(items(payloads))
							(when(payload => payload.publishable,
								publishable => pipe(
									(items(publishable))
									(classify())
									(convert(publisher, city))
									(map(event =>
										delta(event.id, Event, event)
									))
								),
								withdrawn => pipe( // a page not worth publishing withdraws the event it once stated
									(items(withdrawn))
									(map(({ url }) =>
										delta(getEventId(url), Event, null)
									))
								))
							)
						)
					))
				)))
			);

		};

	}

	function expire(): Feed<Delta> {

		// an event stored while it was still to come goes stale on its own, leaving its source page untouched,
		// so the crawl never offers it again and the sweep reads the dataset rather than the source

		return pipe(
			(items(store.lookup({ // !!! replace with select()

				entry: events.id,
				shape: Events,

				model: {
					resources: {
						id: {},
						startDate: {},
						endDate: {},
						"?university": [publisher.university] // !!! publisher
					}
				}

			})))
			(flat(map(events => items(events?.resources ?? [])))) // !!! remove
				(filter(isStaleEvent))
				(map(event =>
					delta(event.id, Event, null)
				))
		);

	}

	function delist(): Task<URLLike, Delta> {

		return urls => {

			const existing = pipe(
				(items(store.lookup({ // !!! replace with select()

					entry: base, // a virtual collection is gathered by class, so the entry is a placeholder
					shape: Pages,

					model: { pages: { id: {}, "?source": [publisher.id] } }

				})))
				(flat(map(pages => items(pages?.pages ?? [])))) // !!! remove
					(map(page => page.id))
			);

			return pipe(
				(items(urls))
				(map(String))
				(retire({ survival, existing }))
				(flat(map(url => items([ // a page the source no longer lists takes its event with it
					delta(url, Page, null),
					delta(getEventId(url), Event, null)
				]))))
			);

		};

	}

}


//// !!! Remove after switching to select() ////////////////////////////////////////////////////////////////////////////

function Events() {
	return resource(Dataset, {

		resources: multiple(reference(Event))

	});
}

function Pages() {
	return resource({

		virtual: true // the pages are gathered by their own class, standing in no collection of their own

	}, {

		id: id(),

		pages: multiple(reference(Page))

	});
}
