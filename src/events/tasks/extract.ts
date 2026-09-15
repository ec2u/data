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
import { digest, type Digest } from "@/_/gear-store/_digest.js";
import { file } from "@/_/gear/files.js";
import { createGoogleAI, json, schema } from "@/_/muse-google/index.js";
import { isStaleEvent } from "@/events/index.js";
import { boolean } from "@metreeca/blue/boolean";
import { optional as maybe, required as must, resource } from "@metreeca/blue/resource";
import { date, string, tag, time, url } from "@metreeca/blue/string";
import type { Instance } from "@metreeca/blue/value";
import { isString, key } from "@metreeca/core";
import { markdown, type Text } from "@metreeca/core/strings";
import { all, object, optional, pass, pattern, required, test, type, type Validator } from "@metreeca/core/trace";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { validate } from "@metreeca/gear-json";


export type Payload = Instance<typeof Extracted> & { // !!! remove

	readonly publishable: boolean
	readonly digest: Digest

}

function Extracted() {
	return resource({

		event: must(boolean),

		url: must(url),
		title: must(string),
		summary: maybe(string),
		description: must(string),

		startDate: must(date),
		startTime: maybe(time),
		endDate: maybe(date),
		endTime: maybe(time),

		entryFees: maybe(string),

		attendanceMode: maybe(string),
		attendanceURL: maybe(url),

		venueName: maybe(string),
		venueAddress: maybe(string),
		venueCity: maybe(string),

		imageURL: maybe(url),
		imageCredits: maybe(string),

		language: must(tag)

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
		(validate(test(stated => stated.event ? Dates(stated) ?? true : true)))
		(map(payload => ({

			...payload,

			publishable: payload.event && !isStaleEvent(payload)

		})))
	);

}


//// !!! ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const isDate: Validator<unknown> = type(isString, all(
	pattern(/^\d{4}-\d{2}-\d{2}$/),
	test(value => !Number.isNaN(Date.parse(value)) || ["{day} expected a calendar date"])
));

const isTime: Validator<unknown> = type(isString, all(
	pattern(/^\d{2}:\d{2}$/),
	test(value => !Number.isNaN(Date.parse(`1970-01-01T${value}:00Z`)) || ["{time} expected a wall clock time"])
));

/**
 * The dates and times a conversion anchors, the only values it cannot carry as the model may state them.
 */
const Dates: Validator<Record<string, unknown>> = object({

	startDate: required(isDate),
	endDate: optional(isDate),
	startTime: optional(isTime),
	endTime: optional(isTime),

	[key]: pass

});
