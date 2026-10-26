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

import { LabelLength } from "@ec2u/data-shared";
import { Event, Events, events, getEventId, isStaleEvent, Publisher } from "@ec2u/data-shared/events/index.js";
import { Page, pages as directory, Pages } from "@ec2u/data-shared/pages/index.js";
import { getUniversity } from "@ec2u/data-shared/universities/index.core.js";
import { University } from "@ec2u/data-shared/universities/index.js";
import { isString, type URLLike } from "@metreeca/core";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { type Feed, pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { find, toSet } from "@metreeca/flow/sinks";
import { filter, flat, fork, map, mix, tee, when } from "@metreeca/flow/tasks";
import { digest } from "@metreeca/work/core/digest.js";
import { delta, type Delta, lookup, retire, settle, type Tally } from "@metreeca/pipe-store";
import { validate } from "@metreeca/mime-jsonld";
import { classify } from "../tasks/classify.js";
import { convert } from "../tasks/convert.js";
import { extract, type Retrieved } from "../tasks/extract.js";
import { read } from "../tasks/read.js";


const retrieval = 10; // the number of pages fetched at the same time from the source site // !!! as option
const analysis = 10; // the number of pages analysed at the same time by the model // !!! as option

const survival = 0.75; // the smallest fraction of the stored events a single run must leave in place // !!! as option


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function sync({

	force = false,

	publisher

}: {

	readonly force?: boolean

	readonly publisher: Publisher

}): Sink<URLLike, Tally> {

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
		(settle())
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

		// a city is named as it is known locally, the way documents name the cities they place venues in

		const { locale } = getUniversity(publisher.university);

		const city = pipe(
			(lookup({

				entry: publisher.university,
				shape: University,

				model: { city: { label: { [locale]: {} } } }

			}))
			(map(({ city: { label } }) => isString(label) ? label : label[locale]))
			(find())
		);

		return urls => {

			const digests = force ? new Set<string>() : pipe(
				(lookup({

					entry: directory.id,
					shape: Pages,

					model: { resources: { digest: {}, "?source": [publisher.id] } } // !!! DSL

				}))
				(map(page => page.digest))
				(toSet())
			);


			async function modified({ document }: Retrieved) {
				return !(await digests).has(digest(document));
			}


			// a page travels with the address the scan listed it under, which names the event it states: what the
			// page says about its own address is data, not identity, and the two branches must agree on the name

			return pipe(urls
				(fork(retrieval, urls => pipe(
					(items(urls))
					(flat(map(url => pipe(
						(items([url]))
						(read())
						(map((document): Retrieved => ({ url: String(url), document })))
					))))
					(filter(modified))
				)))
				(fork(analysis, retrieved => pipe(
					(items(retrieved))
					(extract())
					(classify()) // a payload the classifier drops records no digest, so its page is read again
					(tee(
						payloads => pipe( // every page states its digest, so the crawl won't offer it again
							(items(payloads))
							(map(({ url, digest }): Delta =>
								delta(url, Page, immutable({
									id: url,
									label: clip(url, LabelLength),
									dataset: directory.id,
									source: publisher.id,
									digest
								}))
							))
						),
						payloads => pipe(
							(items(payloads))
							(when(payload => payload.publishable,
								publishable => pipe(
									(items(publishable))
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
			(lookup({

				entry: events.id,
				shape: Events,

				model: {
					resources: {
						id: {},
						startDate: {},
						endDate: {},
						"?university": [publisher.university] // !!! filter on publisher // !!! DSL
					}
				}

			}))
			(filter(isStaleEvent))
			(map(event =>
				delta(event.id, Event, null)
			))
		);

	}

	function delist(): Task<URLLike, Delta> {

		return urls => {

			const existing = pipe(
				(lookup({

					entry: directory.id,
					shape: Pages,

					model: { resources: { id: {}, "?source": [publisher.id] } }

				}))
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
