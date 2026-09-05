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

import { createGoogleAI, json } from "@/_/muse-google/index.js";
import { file } from "@/_/node/files.js";
import type { Event, EventAttendanceMode, Location } from "@/events/index.js";
import { Type } from "@google/genai";
import { opt } from "@metreeca/core";
import { optional, required } from "@metreeca/core/arrays";
import { markdown, type Text } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/structures";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { each } from "@metreeca/flow/sinks";
import { map, peek } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { jpath, link, string } from "@metreeca/gear-json";


/**
 * Creates a task extracting events from event pages.
 *
 * Each markdown page is converted into the event properties it states and emitted in the order pages are drawn, so
 * that a feed of pages is read as a feed of events.
 *
 * Pages are handed to the {@link createGoogleAI Gemini client} bound to the enclosing execution, one request each, so
 * that credentials, endpoint and quota pacing are settled once by the consumer binding that client rather than by the
 * task: a feed extracting at speed is held back by that pacing rather than rejected by the API.
 *
 * Events are extracted at a fixed seed, so that the same page yields the same properties as consistently as the model
 * allows. The current date travels with each request, so a page stating a relative date is resolved against the day it
 * is drawn on rather than against the day the task was created on.
 *
 * The title and start date of an event are declared required to the API, matching the properties an {@link Event}
 * states unconditionally, and the remaining properties are extracted as far as the page states them. Declaring that
 * set is what makes extraction complete: left optional, the omission rules the prompt states dominate and a page is
 * stripped down to two or three properties it happens to state most plainly. Prompting alone does not recover them,
 * whatever the model.
 *
 * The language of an event is not among them, and is left to whoever knows it: a page reaching this task has usually
 * been rendered into a common language upstream, so a language read off it would name that rendering rather than the
 * event.
 *
 * Every record is emitted as an {@link Event} stripped of the properties that identify it as a dataset resource, so
 * that the page it was read from and the university it belongs to are settled by whoever draws it rather than by this
 * task.
 *
 * Generation is capped, so that a page the model runs away on is rejected early rather than paid for to the end: a
 * runaway copies the page into a property until the response is truncated and no longer parses, and the cap decides
 * how much of that is bought before the request fails. Raising it buys proportionally more of the same runaway rather
 * than a complete record.
 *
 * > [!NOTE]
 * >
 * > - **Incremental**: each event is emitted as soon as it is extracted, so the feed produced runs dry as the feed
 * >   drawn from does and an endless source is read as long as it is consumed.
 * > - **Streaming**: pages are extracted one item at a time, none retained.
 * > - **Stateless**: every page is extracted on its own, so the outcome is unaffected by how the feed is split across
 * >   nested feeds or runs.
 *
 * The client is resolved as the task is created, so the enclosing execution must already be running by then and every
 * page drawn is extracted through the same client, however long the feed runs. The prompt steering the extraction is
 * read from the `.sys.md` file shipped alongside this module, so a deployment must carry it next to the compiled
 * code.
 *
 * @param options The extraction options
 * @param options.model The Gemini model events are extracted by; if undefined, a general-purpose model is used
 *
 * @returns A task converting a feed of markdown event pages into a feed of the events they state
 *
 * @throws {Error} If no execution is running, as the Gemini client is resolved from the enclosing one
 *
 * @throws {Error} While the feed is consumed, if the prompt shipped alongside the module cannot be read, whatever the
 * source reports while producing pages, whatever the API reports on a request it cannot recover from, or if the model
 * replies with no output text or with malformed JSON
 */
export function extract({

	model = "gemini-3.5-flash"

}: {

	model?: string

} = {}): Task<Text, Omit<Event, "id" | "university" | "url">> {

	const ai = service(createGoogleAI);

	return documents => pipe(
		items(documents)
		(map(async document => json<{

			readonly title: string;
			readonly summary?: string;
			readonly description?: string;

			readonly startDate: string;
			readonly startTime?: string;
			readonly endDate?: string;
			readonly endTime?: string;

			readonly entryFees?: "free" | "paid";
			readonly attendanceMode?: "offline" | "online" | "mixed";
			readonly attendanceURL?: string;

			readonly venueName?: string;
			readonly venueAddress?: string;
			readonly venueCity?: string;

			readonly imageURL?: string;
			readonly imageCredits?: string;

			readonly topic?: string;
			readonly audience?: string;

		}>(await ai.models.generateContent({

			model,

			contents: [
				markdown`
					- date: ${new Date().toISOString().slice(0, 10)}
				`,
				document
			],

			config: {

				seed: 0,

				maxOutputTokens: 8192,

				systemInstruction: await file(".sys.md", import.meta.url),

				responseMimeType: "application/json",
				responseSchema: {

					type: Type.OBJECT,

					properties: {

						title: {
							type: Type.STRING,
							description: "The event title"
						},

						summary: {
							type: Type.STRING,
							description: "A plain text summary of less than 500 characters, with no markdown formatting"
						},

						description: {
							type: Type.STRING,
							description: "The complete descriptive text of the event, in markdown format"
						},

						startDate: {
							type: Type.STRING,
							format: "date",
							description: "The start date as an ISO calendar date (yyyy-mm-dd)"
						},

						startTime: {
							type: Type.STRING,
							description: "The start time as an ISO wall clock time without seconds (hh:mm)"
						},

						endDate: {
							type: Type.STRING,
							format: "date",
							description: "The end date as an ISO calendar date (yyyy-mm-dd)"
						},

						endTime: {
							type: Type.STRING,
							description: "The end time as an ISO wall clock time without seconds (hh:mm)"
						},

						entryFees: {
							type: Type.STRING,
							format: "enum",
							enum: ["free", "paid"],
							description: "The entry cost"
						},

						attendanceMode: {
							type: Type.STRING,
							format: "enum",
							enum: ["offline", "online", "mixed"],
							description: "The way the event is attended"
						},

						attendanceURL: {
							type: Type.STRING,
							description: "The URL for attending the event remotely"
						},

						venueName: {
							type: Type.STRING,
							description: "The name of the venue"
						},

						venueAddress: {
							type: Type.STRING,
							description: "The street address of the venue"
						},

						venueCity: {
							type: Type.STRING,
							description: "The city the venue is located in"
						},

						imageURL: {
							type: Type.STRING,
							description: "The URL of the image illustrating the event, query component included"
						},

						imageCredits: {
							type: Type.STRING,
							description: "The credits or the copyright notice for the image"
						},

						topic: {
							type: Type.STRING,
							description: "The major topic of the event"
						},

						audience: {
							type: Type.STRING,
							description: "The intended audience of the event"
						}

					},

					required: ["title", "startDate"]

				}

			}

		}))))
		(peek(console.log))
		(jpath(path => {

			const startDate = required(path("startDate").map(string));
			const endDate = optional(path("endDate").map(string));
			const endTime = optional(path("endTime").map(string));

			const attendanceURL = optional(path("attendanceURL").map(link));
			const venueName = optional(path("venueName").map(string));
			const venueAddress = optional(path("venueAddress").map(string));
			const venueCity = optional(path("venueCity").map(string));

			// !!! id/university/url: page identity and university are not available to this task
			// !!! about/audience: topic/audience strings are to be matched against the taxonomies downstream
			// !!! inLanguage: the language is not extracted, as pages usually reach this task already translated

			return immutable({

				generated: true,

				name: required(path("title").map(string)),
				description: optional(path("description").map(string)),
				disambiguatingDescription: optional(path("summary").map(string)),

				startDate: required(stamp(startDate, optional(path("startTime").map(string)))),

				endDate: optional(endDate === undefined && endTime === undefined ? undefined
					: stamp(endDate ?? startDate, endTime)),

				isAccessibleForFree: optional(path("entryFees").map(string).map(fees => fees === "free")),
				eventAttendanceMode: optional(path("attendanceMode").map(string).map(attendance)),

				image: optional(path("imageURL").map(link).map(url => ({
					url,
					copyrightNotice: optional(path("imageCredits").map(string))
				}))),

				location: optional<Location>(
					opt(attendanceURL, url => ({ url }))
					?? opt(venueAddress, address => ({
						name: venueName,
						streetAddress: address,
						addressLocality: venueCity
					}))
					?? venueName
				)
			});

		}))
	);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// !!! zone: dates are stated as the source states them, as the university zone is not available to this task

function stamp(date: string, time: undefined | string): string {
	return time === undefined ? date : `${date}T${time}`;
}

function attendance(mode: string): undefined | EventAttendanceMode {
	return mode === "offline" ? "OfflineEventAttendanceMode"
		: mode === "online" ? "OnlineEventAttendanceMode"
			: mode === "mixed" ? "MixedEventAttendanceMode"
				: undefined;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await pipe(
		items({

			title: "Doctoral Seminar on Urban Mobility",
			summary: "A three-day seminar on sustainable urban mobility, open to doctoral students and practitioners.",
			description: "The seminar reviews current research on sustainable urban mobility.\n\n## Programme\n\nKeynotes, paper sessions and a closing round table.",

			startDate: "2026-09-14",
			startTime: "09:30",
			endDate: "2026-09-16",
			endTime: "17:00",

			entryFees: "free",
			attendanceMode: "mixed",
			attendanceURL: "https://meet.example.org/urban-mobility",

			venueName: "Aula Magna",
			venueAddress: "Largo da Porta Ferrea 1",
			venueCity: "Coimbra",

			imageURL: "https://example.org/images/urban-mobility.jpg?width=1200",
			imageCredits: "Example University",

			topic: "Urban mobility",
			audience: "Doctoral students"

		})
		(jpath(path => {

			const startDate = required(path("startDate").map(string));
			const endDate = optional(path("endDate").map(string));
			const endTime = optional(path("endTime").map(string));

			const attendanceURL = optional(path("attendanceURL").map(link));
			const venueName = optional(path("venueName").map(string));
			const venueAddress = optional(path("venueAddress").map(string));
			const venueCity = optional(path("venueCity").map(string));

			// !!! id/university/url: page identity and university are not available to this task
			// !!! about/audience: topic/audience strings are to be matched against the taxonomies downstream
			// !!! inLanguage: the language is not extracted, as pages usually reach this task already translated

			return immutable({

				generated: true,

				name: required(path("title").map(string)),
				description: optional(path("description").map(string)),
				disambiguatingDescription: optional(path("summary").map(string)),

				startDate: required(stamp(startDate, optional(path("startTime").map(string)))),

				endDate: optional(endDate === undefined && endTime === undefined
					? undefined
					: stamp(endDate ?? startDate, endTime)
				),

				isAccessibleForFree: optional(path("entryFees").map(string).map(fees => fees === "free")),
				eventAttendanceMode: optional(path("attendanceMode").map(string).map(attendance)),

				image: optional(path("imageURL").map(link).map(url => ({
					url,
					copyrightNotice: optional(path("imageCredits").map(string))
				}))),

				location: optional<Location>(
					opt(attendanceURL, url => ({ url }))
					?? opt(venueAddress, streetAddress => ({
						name: venueName, streetAddress, addressLocality: venueCity
					}))
					?? venueName
				)

			});

		}))
		(each(console.log))
	);
}
