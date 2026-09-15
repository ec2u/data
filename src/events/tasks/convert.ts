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

import { getEventId, type Event, events } from "@/events/index.js";
import { LabelLength } from "@/vocabularies/ec2u.js";
import { SchemaEventAttendanceModeEnumeration } from "@/vocabularies/schema/event.js";
import { SchemaLocation } from "@/vocabularies/schema/location.js";
import type { Instance } from "@metreeca/blue/value";
import { type Object, opt, type Optional } from "@metreeca/core";
import { multiple, nonempty, optional, required } from "@metreeca/core/arrays";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/structures";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { filter } from "@metreeca/flow/tasks";
import { jpath, link, string } from "@metreeca/gear-json";
import type { Reference } from "@metreeca/qest/resource";


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

	readonly id: Reference
	readonly zone: string

}): Task<Object, Instance<typeof Event>> {

	return payloads => pipe(
		items(payloads)
		(filter(payload => payload.event === true))
		(jpath(path => {

			const digest = required(path("digest").map(string));

			const url = required(path("url").map(link));
			const title = clip(required(path("title").map(string)), LabelLength);

			const startDate = required(path("startDate").map(string));
			const endDate = optional(path("endDate").map(string));
			const endTime = optional(path("endTime").map(string));

			const attendanceURL = optional(path("attendanceURL").map(link));
			const venueName = optional(path("venueName").map(string));
			const venueAddress = optional(path("venueAddress").map(string));
			const venueCity = optional(path("venueCity").map(string));

			return immutable({

				generated: true,

				id: getEventId(url),
				url: nonempty(url),

				dataset: events.id,

				university: university.id,

				digest,

				label: title,

				keywords: multiple(path("keywords[*]").map(link)),

				name: title,
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
					url: nonempty(url),
					copyrightNotice: optional(path("imageCredits").map(string))
				}))),

				location: optional<Instance<typeof SchemaLocation>>(
					opt(attendanceURL, url => ({ url: [url] }))
					?? opt(venueAddress ?? venueCity, () => ({
						name: venueName, streetAddress: venueAddress, addressLocality: venueCity
					}))
					?? venueName
				)

			});

		})));

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function stamp(date: string, time: Optional<string>, zone: string): string { // !!! to temporals?

	const clock = time ?? "00:00";

	// times are stated to the minute, while a timestamp is read to the second

	const wall = `${date}T${/^\d{2}:\d{2}$/.test(clock) ? `${clock}:00` : clock}`;

	const shift = new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "longOffset" })
		.formatToParts(new Date(`${wall}Z`))
		.find(({ type }) => type === "timeZoneName")
		?.value ?? "GMT";

	return `${wall}${shift === "GMT" ? "Z" : shift.slice(3)}`;

}


function attendance(mode: string): Optional<Instance<typeof SchemaEventAttendanceModeEnumeration>> { // !!! type
	return mode === "offline" ? "OfflineEventAttendanceMode"
		: mode === "online" ? "OnlineEventAttendanceMode"
			: mode === "mixed" ? "MixedEventAttendanceMode"
				: undefined;
}
