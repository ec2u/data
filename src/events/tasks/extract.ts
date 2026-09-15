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
import { createGoogleAI, json } from "@/_/muse-google/index.js";
import { isStaleEvent } from "@/events/index.js";
import { Type } from "@google/genai";
import { isAny, isObject, isOptional, isString, key, type Object } from "@metreeca/core";
import { markdown, type Text } from "@metreeca/core/strings";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { filter, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { log } from "@metreeca/tape";


const logger = log(import.meta.url);


/**
 * Payload an extraction answers a page with.
 *
 * States under `digest` and `publishable` what the extraction settled for itself, whatever the model read into the
 * page; every other property is answered by the model and so stands or falls at run time.
 */
export type Payload =
	Object
	& {

		readonly digest: Digest
		readonly publishable: boolean

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
		(map(async document => complete(document, json(await ai.models.generateContent({

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
				responseSchema: {

					type: Type.OBJECT,

					properties: {

						event: {
							type: Type.BOOLEAN
						},

						url: {
							type: Type.STRING,
							format: "uri"
						},

						title: {
							type: Type.STRING
						},

						summary: {
							type: Type.STRING
						},

						description: {
							type: Type.STRING
						},

						startDate: {
							type: Type.STRING,
							format: "date"
						},

						startTime: {
							type: Type.STRING,
							pattern: "^[0-9]{2}:[0-9]{2}$"
						},

						endDate: {
							type: Type.STRING,
							format: "date"
						},

						endTime: {
							type: Type.STRING,
							pattern: "^[0-9]{2}:[0-9]{2}$"
						},

						entryFees: {
							type: Type.STRING
						},

						attendanceMode: {
							type: Type.STRING
						},

						attendanceURL: {
							type: Type.STRING,
							format: "uri"
						},

						venueName: {
							type: Type.STRING
						},

						venueAddress: {
							type: Type.STRING
						},

						venueCity: {
							type: Type.STRING
						},

						imageURL: {
							type: Type.STRING,
							format: "uri"
						},

						imageCredits: {
							type: Type.STRING
						},

						language: {
							type: Type.STRING,
							pattern: "^[a-z]{2}$"
						}

					},

					required: [
						"event",
						"url",
						"title",
						"description",
						"startDate",
						"language"
					]

				}

			}

		})))))
		(filter(intact))
	);

	function complete(document: Text, payload: Object): Payload {

		return {

			...payload,

			digest: digest(document),

			publishable: payload.event === true
				&& isDay(payload.startDate)
				&& !isStaleEvent({

					startDate: payload.startDate,
					endDate: isDay(payload.endDate) ? payload.endDate : undefined

				})

		};

	}

	// a payload the model fills with values a conversion cannot carry is a failed reading, not a page settled as
	// bearing nothing: it is dropped rather than answered, so that a caller records nothing and reads the page again

	function intact(payload: Payload): boolean {

		const sound: boolean = payload.event !== true || isObject(payload, { // annotated, or the guard narrows the miss

			startDate: isDay,
			endDate: value => isOptional(value, isDay),
			startTime: value => isOptional(value, isClock),
			endTime: value => isOptional(value, isClock),

			[key]: isAny

		});

		if ( !sound ) {
			logger.warning`dropping malformed event extracted from <${payload.url}>`;
		}

		return sound;

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function isDay(value: unknown): value is string {
	return isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isClock(value: unknown): value is string {
	return isString(value) && /^\d{2}:\d{2}$/.test(value) && !Number.isNaN(Date.parse(`1970-01-01T${value}:00Z`));
}
