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

import { english, LabelLength } from "@ec2u/data-shared";
import { Event, Events, events, getEventId, isStaleEvent, Publisher } from "@ec2u/data-shared/events/index.js";
import { Page, pages as directory, Pages } from "@ec2u/data-shared/pages/index.js";
import { University } from "@ec2u/data-shared/universities/index.js";
import { type URLLike } from "@metreeca/core";
import { clip, type Markdown } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { type Feed, pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { find, toSet } from "@metreeca/flow/sinks";
import { filter, flat, fork, map, mix, tee, when } from "@metreeca/flow/tasks";
import { fetch } from "@metreeca/pipe-url";
import { focus, html, untag } from "@metreeca/mime-xml";
import { digest } from "@metreeca/work/core/digest.js";
import { delta, type Delta, lookup, retire, settle, type Tally } from "@metreeca/pipe-store";
import { validate } from "@metreeca/mime-jsonld";
import { classify } from "../tasks/classify.js";
import { convert } from "../tasks/convert.js";
import { extract } from "../tasks/extract.js";


const retrieval = 10; // the number of pages fetched at the same time from the source site // !!! as option
const analysis = 10; // the number of pages analysed at the same time by the model // !!! as option

const survival = 0.75; // the smallest fraction of the stored events a single run must leave in place // !!! as option


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function sync(publisher: Publisher, force = false): Sink<URLLike, Tally> {

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

		const city = pipe(
			(lookup({

				entry: publisher.university,
				shape: University,

				model: { city: { label: {} } }

			}))
			(map(university => english(university.city.label)))
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
