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
import { file } from "@/_/host-node/files.js";
import { events, type Event, type EventAttendanceMode, type Location } from "@/events/index.js";
import { universities } from "@/universities/index.js";
import { Type } from "@google/genai";
import { opt, type Optional, type Value } from "@metreeca/core";
import { multiple, optional, required } from "@metreeca/core/arrays";
import type { IRI } from "@metreeca/core/resource";
import { markdown, type Text } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/structures";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { each } from "@metreeca/flow/sinks";
import { map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { jpath, link, string } from "@metreeca/gear-json";
import * as uuid from "uuid";


/**
 * Creates a task extracting events from event pages.
 *
 * Each markdown page is converted into the {@link Event} it states, in the order pages are drawn, and attributed to
 * the given university. A page must open with a frontmatter block stating the URL it was retrieved from, which the
 * record carries; its own identity and the language of the event are left to whoever draws it.
 *
 * The {@link createGoogleAI Gemini client} is resolved as the task is created, so the enclosing execution must
 * already be running by then, and the steering prompt is read from the `.sys.md` file shipped alongside this module,
 * so a deployment must carry it next to the compiled code.
 *
 * @returns A task converting a feed of markdown event pages into a feed of the events they state
 *
 * @throws {Error} If no execution is running, as the Gemini client is resolved from the enclosing one
 *
 * @throws {Error} While the feed is consumed, if the prompt cannot be read, whatever the source reports while producing
 * pages, whatever the API reports on a request it cannot recover from, or if the model replies with no output text or
 * with malformed JSON
 */
export function extract(university: {

	readonly id: IRI
	readonly zone: string

}): Task<Text, Event> {

	const ai = service(createGoogleAI);

	return documents => pipe(
		items(documents)
		(map(async document => json(await ai.models.generateContent({

			model: "gemini-3.5-flash",

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

						url: {
							type: Type.STRING,
							description: "The URL the document was retrieved from, as stated in its frontmatter"
						},

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

					required: ["url", "title", "startDate"]

				}

			}

		}))))
		(convert(university))
	);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function stamp(date: string, time: Optional<string>, zone: string): string { // !!! to temporals?

	const wall = `${date}T${time ?? "00:00"}`;

	const shift = new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "longOffset" })
		.formatToParts(new Date(`${wall}Z`))
		.find(({ type }) => type === "timeZoneName")
		?.value ?? "GMT";

	return `${wall}${shift === "GMT" ? "Z" : shift.slice(3)}`;

}


function attendance(mode: string): Optional<EventAttendanceMode> {
	return mode === "offline" ? "OfflineEventAttendanceMode"
		: mode === "online" ? "OnlineEventAttendanceMode"
			: mode === "mixed" ? "MixedEventAttendanceMode"
				: undefined;
}

function about(topic: string): readonly IRI[] {
	return []; // !!! match `topic` against the EC2U events taxonomy, keeping the closest concept
}

function audience(stakeholder: string): readonly IRI[] {
	return []; // !!! match `stakeholder` against the EC2U stakeholders taxonomy, keeping the closest concept
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


if ( import.meta.main ) {
	await pipe(
		items({

			url: "https://example.org/events/urban-mobility",

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
		(convert(universities.coimbra))
		(each(console.log))
	);
}


function convert(university: {

	readonly id: IRI
	readonly zone: string

}): Task<Value, Event> {

	return jpath(path => {

		const url = required(path("url").map(link));

		const startDate = required(path("startDate").map(string));
		const endDate = optional(path("endDate").map(string));
		const endTime = optional(path("endTime").map(string));

		const attendanceURL = optional(path("attendanceURL").map(link));
		const venueName = optional(path("venueName").map(string));
		const venueAddress = optional(path("venueAddress").map(string));
		const venueCity = optional(path("venueCity").map(string));

		// !!! inLanguage: the language is not extracted, as pages usually reach this task already translated

		return immutable<Event>({

			id: `${events}/${uuid.v3(url, uuid.v3.URL)}`,
			url: multiple(url),

			generated: true,
			university: university.id,

			about: multiple(path("topic").map(string).flatMap(about)),
			audience: multiple(path("audience").map(string).flatMap(audience)),

			name: required(path("title").map(string)),
			description: optional(path("description").map(string)),
			disambiguatingDescription: optional(path("summary").map(string)),

			startDate: required(stamp(startDate, optional(path("startTime").map(string)), university.zone)),

			endDate: optional(endDate === undefined && endTime === undefined
				? undefined
				: stamp(endDate ?? startDate, endTime, university.zone)
			),

			isAccessibleForFree: optional(path("entryFees").map(string).map(fees => fees === "free")),
			eventAttendanceMode: optional(path("attendanceMode").map(string).map(attendance)),

			image: optional(path("imageURL").map(link).map(url => ({
				url,
				copyrightNotice: optional(path("imageCredits").map(string))
			}))),

			location: optional<Location>(
				opt(attendanceURL, url => ({ url }))
				?? opt(venueAddress ?? venueCity, () => ({
					name: venueName, streetAddress: venueAddress, addressLocality: venueCity
				}))
				?? venueName
			)

		});

	});

}
