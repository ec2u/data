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

import { type Event, type EventAttendanceMode, events, type Location } from "@/events/index.js";
import { universities } from "@/universities/index.js";
import { isObject, opt, type Optional, type Value } from "@metreeca/core";
import { multiple, optional, required } from "@metreeca/core/arrays";
import type { IRI } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/structures";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { each } from "@metreeca/flow/sinks";
import { filter } from "@metreeca/flow/tasks";
import { jpath, link, string } from "@metreeca/gear-json";
import * as uuid from "uuid";

export function convert(university: {

	readonly id: IRI
	readonly zone: string

}): Task<Value, Event> {

	return payloads => pipe(
		items(payloads)
		(filter(payload => !isObject(payload) || payload["event"] !== false)) // a page stating no event yields none
		(jpath(path => {

		const url = required(path("url").map(link));

		const startDate = required(path("startDate").map(string));
		const endDate = optional(path("endDate").map(string));
		const endTime = optional(path("endTime").map(string));

		const attendanceURL = optional(path("attendanceURL").map(link));
		const venueName = optional(path("venueName").map(string));
		const venueAddress = optional(path("venueAddress").map(string));
		const venueCity = optional(path("venueCity").map(string));

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

			inLanguage: optional(path("language").map(string)),

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

		}))
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

			event: true,

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
			audience: "Doctoral students",

			language: "en"

		})
		(convert(universities.coimbra))
		(each(console.log))
	);
}
