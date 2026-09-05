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


/**
 * Creates a task converting extracted event properties into event records.
 *
 * Payloads stating no event are dropped, so the output of an extraction may be piped through unfiltered. Each record
 * is identified after the page it was drawn from, so the same page always yields the same event, and wall times are
 * anchored to the time zone of `university`.
 *
 * @param university The university the events are attributed to
 * @param university.id The identifier the events are attributed to
 * @param university.zone The IANA time zone the extracted dates and times are read in
 *
 * @returns A task converting a feed of extracted property payloads into a feed of immutable event records
 *
 * @throws {@link !TypeError TypeError} While the feed is consumed, if a payload states no URL, title or start date, or
 * more than one of any of them
 */
export function convert(university: {

	readonly id: IRI
	readonly zone: string

}): Task<Value, Event> {

	return payloads => pipe(
		items(payloads)
		(filter(payload => isObject(payload) && payload.event === true)) // a page stating no event yields none
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
