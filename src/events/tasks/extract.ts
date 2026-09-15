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

import { getDate } from "@/_/core/temporal.js";
import { digest } from "@/_/gear-store/_digest.js";
import { validate } from "@/_/gear-store/validate.js";
import { file } from "@/_/gear/files.js";
import { createGoogleAI, json, schema } from "@/_/muse-google/index.js";
import { isStaleEvent } from "@/events/index.js";
import { boolean } from "@metreeca/blue/boolean";
import { optional, required, resource } from "@metreeca/blue/resource";
import { date, string, tag, time, url } from "@metreeca/blue/string";
import type { Instance } from "@metreeca/blue/value";
import { markdown, type Text } from "@metreeca/core/strings";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { filter, map, tee } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";


type Reading = Instance<typeof X>

export type Payload = Reading & { // !!! remove

	readonly publishable: boolean

}



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Extracted() {
	return resource({

		event: required(boolean),

		url: required(url),
		title: required(string),
		summary: optional(string),
		description: required(string),

		startDate: required(date),
		startTime: optional(time),
		endDate: optional(date),
		endTime: optional(time),

		entryFees: optional(string),

		attendanceMode: optional(string),
		attendanceURL: optional(url),

		venueName: optional(string),
		venueAddress: optional(string),
		venueCity: optional(string),

		imageURL: optional(url),
		imageCredits: optional(string),

		language: required(tag)

	});
}


function X() {
	return resource(Extracted, {

		digest: required(string)

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a task extracting event properties from event pages.
 *
 * Payloads are produced in the order pages are drawn. A page describing no single event, such as a listing or an error
 * page, is answered with a payload stating `event` false, so a caller MUST drop those rather than read them.
 *
 * Every payload states under `publishable` whether anything is worth drawing from the page at all: a page stating no
 * event, or one whose event has already run its course, answers `false`, so that a caller spends nothing further on it.
 * The dates are weighed as the page states them, ahead of the conversion that anchors them to the time zone of the
 * university: the two readings part only for an event ending within a day of the current one, which is left in place
 * either way.
 *
 * A page the model answers with values a conversion cannot carry yields no payload at all, as against one answered
 * `publishable` false: the first is a reading that failed and is worth attempting again, the second a page settled as
 * bearing nothing.
 *
 * Every payload states under `digest` the state of the page it was derived from, so that what is stored from it may be
 * recorded together with the evidence for reading the page again only once the source has changed it.
 *
 * @returns A task converting a feed of markdown event pages into a feed of the property payloads they state
 *
 * @throws {@link !Error Error} If no execution is running
 *
 * @throws {@link !Error Error} While the feed is consumed, if no properties can be extracted from a page
 */
export function extract(): Task<Text, Payload> {

	const ai = service(createGoogleAI);

	return documents => pipe(
		items(documents)
		(map(async document => ({

			digest: digest(document),

			...json<Instance<typeof Extracted>>(await ai.models.generateContent({

				model: "gemini-3.5-flash-lite",

				contents: [
					markdown`
						- date: ${getDate()}
					`,
					document
				],

				config: {

					seed: 0,
					temperature: 0,
					maxOutputTokens: 16384,

					systemInstruction: await file(".sys.md", import.meta.url),

					responseMimeType: "application/json",
					responseSchema: schema(Extracted)

				}

			}))

		})))
		(when(extracted => extracted.event, validate(X)))
		(map(extracted => ({

			publishable: extracted.event && !isStaleEvent(extracted),

			...extracted

		})))
	);

}


//// !!! ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a task routing the items on a condition.
 *
 * The items meeting the condition are handed to one task and the others are left as they are, so a stage applying to
 * part of a feed is stated where it belongs rather than as two pipes weighing the same condition from either side.
 *
 * @typeParam V The type of items drawn from the feed
 *
 * @param condition The condition weighed on each item
 * @param pass The task handed the items meeting `condition`
 *
 * @returns A task yielding what `pass` reports for the items meeting `condition`, together with the other items as
 *     they were drawn
 */
export function when<V>(condition: (value: NoInfer<V>) => boolean, pass: Task<NoInfer<V>>): Task<V>

/**
 * Creates a task routing the items on a condition.
 *
 * The items meeting the condition are handed to one task and the others to another, so a feed splitting on a
 * condition is stated as the two readings it takes rather than as two pipes weighing the same condition from either
 * side.
 *
 * @typeParam V The type of items drawn from the feed
 * @typeParam R The type of items both tasks report
 *
 * @param condition The condition weighed on each item
 * @param pass The task handed the items meeting `condition`
 * @param fail The task handed the items failing it
 *
 * @returns A task yielding what `pass` and `fail` report, as they report it
 */
export function when<V, R>(
	condition: (value: NoInfer<V>) => boolean,
	pass: Task<NoInfer<V>, R>,
	fail: Task<NoInfer<V>, R>
): Task<V, R>

/**
 * @remarks
 *
 * Each task is handed the share of the items it is due as a feed of its own, so state it initialises on invocation
 * decides on that share alone; both are drawn in lockstep, one item on offer at a time, and neither holds the other
 * back once it runs dry.
 *
 * > [!CAUTION]
 * >
 * > The condition is weighed once for each reading, and so twice on every item: it is expected to answer the same way
 * > each time and to cost little enough to bear it. Work worth doing once belongs upstream, in a stage stating its
 * > outcome on the item.
 *
 * > [!NOTE]
 * >
 * > - **Incremental**: items are emitted as the tasks report them, so the reported feed runs dry as the feed drawn
 * >   from and both tasks do.
 * > - **Streaming**: one item is on offer at a time and none is retained, whatever the tasks retain.
 * > - **Stateless**: the routing carries no state across items, whatever the tasks carry.
 *
 * > [!WARNING]
 * >
 * > Output order is not preserved: the items of the two tasks interleave and overtake each other according to how
 * > long each takes, though the items of each keep their own order among themselves.
 *
 * @see {@link tee}
 */
export function when<V>(condition: (value: V) => boolean, pass: Task<V>, fail: Task<V> = feed => feed): Task<V> {

	return tee(
		feed => pass(feed(filter(condition))),
		feed => fail(feed(filter(value => !condition(value))))
	);

}
