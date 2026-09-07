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

import { type Digest, digest } from "@/events/_/digest.js";
import { isStale } from "@/events/index.js";
import { type Delta } from "@/events/_/persist.js";
import { convert } from "@/events/tasks/convert.js";
import { extract } from "@/events/tasks/extract.js";
import { IRI } from "@metreeca/core/resource";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { filter, flat, fork, map, peek } from "@metreeca/flow/tasks";
import { validate } from "@metreeca/gear-json";
import { fetch } from "@metreeca/gear-url";
import { focus, html, untag } from "@metreeca/gear-xml";


/**
 * Creates a task drawing events from their pages.
 *
 * Each page yields the state the store is to hold for the event it describes, attributed to `university` and anchored
 * to its time zone, or its removal where the event is already stale. A page unchanged since the last run is left
 * alone, and a page the run never reached leaves its events untouched: nothing is stated about an event that was not
 * seen, so an unreachable source never reads as an absent one.
 *
 * @param university The university the events are attributed to
 * @param university.id The identifier the events are attributed to
 * @param university.zone The IANA time zone the extracted dates and times are read in
 *
 * @returns A task turning a feed of event page URLs into a feed of deltas
 */
export function harvest(university: {

	readonly id: IRI
	readonly zone: string

}): Task<string | URL, Delta> {

	const digests = new Map<string, Digest>;  // !!! populate from the store, keyed by source page URL (paging?)

	return urls => pipe(
		items(urls)
		(fork(10, flat(map(url => pipe( // a pipe per page keeps the source URL in scope as the digest key
			(items([url]))
			(fetch())
			(html())
			(focus())
			(untag())
			(filter(page => digests.get(String(url)) !== digest(page)))
			(extract())
			(peek(console.log) /* !!! */)
			(convert(university))
			(peek(console.log) /* !!! */)
			(validate(v => undefined) /* !!! */)
			(map(event => [event.id, isStale(event) ? null : event] satisfies Delta))
		)))))
	);

}
