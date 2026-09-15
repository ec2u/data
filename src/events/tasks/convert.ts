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
import { getUniversity } from "@/universities/index.core.js";
import { LabelLength } from "@/vocabularies/ec2u.js";
import { SchemaEventAttendanceModeEnumeration } from "@/vocabularies/schema/event.js";
import { SchemaLocation } from "@/vocabularies/schema/location.js";
import type { Instance } from "@metreeca/blue/value";
import { type Object, opt, type Optional, type Value } from "@metreeca/core";
import { multiple, nonempty, optional, required } from "@metreeca/core/arrays";
import { clip, tidy } from "@metreeca/core/strings";
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
 * is identified after the page it was derived from, so the same page always yields the same event.
 *
 * A page states a wall date and a wall time, carrying no zone of their own, and the record states the instant they
 * name in the zone `university` keeps, at the offset that zone keeps on the day in question rather than the one it
 * keeps today. An event stating no time opens at midnight, and one stating an end time alone closes on the day it
 * opens.
 *
 * A venue is stated as a postal address only where the page names a street, a street being what tells an address from
 * a virtual location; a venue named without one, or a bare city, is stated as plain text instead.
 *
 * @param publisher The publisher whose pages the events were drawn from; the university the events are attributed to,
 *   and the zone their wall dates and times are read in, are recovered from the one it names
 * @param publisher.id The identifier the events name their publisher by
 * @param publisher.university The university the publisher stands for
 *
 * @returns A task converting a feed of extracted property payloads into a feed of immutable event records
 *
 * @throws {@link !RangeError RangeError} If `publisher` names no known university
 *
 * @throws {@link !TypeError TypeError} While the feed is consumed, if a payload states no URL, title or start date, or
 * more than one of any of them
 */
export function convert(publisher: {

	readonly id: Reference
	readonly university: Reference

}): Task<Object, Instance<typeof Event>> {

	const university = getUniversity(publisher.university);

	return payloads => pipe(
		items(payloads)
		(filter(payload => payload.event === true))
		(jpath(path => {

			const url = required(path("url").map(link));

			// folded before it is clipped, so the budget is spent on the line the label and the name are held to

			const title = clip(tidy(required(path("title").map(string))), LabelLength);

			const startDate = required(path("startDate").map(string));
			const endDate = optional(path("endDate").map(string));
			const endTime = optional(path("endTime").map(string));

			const attendanceURL = optional(path("attendanceURL").map(link));
			const venueName = optional(line(path("venueName")));
			const venueAddress = optional(line(path("venueAddress")));
			const venueCity = optional(line(path("venueCity")));

			return immutable({

				generated: true,

				id: getEventId(url),
				url: nonempty(url),

				dataset: events.id,

				university: university.id,
				publisher: publisher.id,

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
					copyrightNotice: optional(line(path("imageCredits")))
				}))),

				location: optional<Instance<typeof SchemaLocation>>(
					opt(attendanceURL, url => ({ url: [url] }))
					?? opt(venueAddress, streetAddress => ({
						name: venueName, streetAddress, addressLocality: venueCity
					}))
					?? venueName
					?? venueCity
				)

			});

		})));

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// a plain text slot admits a single unformatted line, so a value the model pads, runs together or wraps is folded
// before it is stated and one left with nothing is dropped

function line(values: readonly Value[]): readonly string[] {
	return values.map(string).map(value => tidy(value)).filter(value => value.length > 0);
}


// the fraction of a second and the zone designator an XSD date and time may carry: a page states the hour as a clock
// at the venue reads it, so a model stating one anyway is naming that same wall time and the tail is set aside

const appended = /(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;


function stamp(date: string, time: Optional<string>, zone: string): string { // !!! to temporals?

	// the wall date and time the page states, taken bare, whatever the extraction appended to them

	const wall = `${date.replace(appended, "")}T${(time ?? "00:00:00").replace(appended, "")}`;

	// an extraction vets the dates it answers, so an unreadable wall time is left unanchored for the shape to reject
	// rather than aborting the run the conversion runs in

	const instant = new Date(`${wall}Z`);

	if ( Number.isNaN(instant.getTime()) ) {

		return `${wall}Z`;

	} else {

		// the offset is the one the zone keeps at the instant the wall time names in the zone, not at the one it names
		// in UTC: on the day a zone shifts, the two fall either side of the shift and the event is stamped an hour out

		return `${wall}${shift(zone, new Date(instant.getTime()-millis(shift(zone, instant))))}`;

	}

}

function shift(zone: string, instant: Date): string {

	const name = new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "longOffset" })
		.formatToParts(instant)
		.find(({ type }) => type === "timeZoneName")
		?.value ?? "GMT";

	return name === "GMT" ? "Z" : name.slice(3);

}

function millis(offset: string): number {
	return offset === "Z" ? 0
		: (offset.startsWith("-") ? -1 : 1)*(Number(offset.slice(1, 3))*60+Number(offset.slice(4, 6)))*60*1000;
}


function attendance(mode: string): Optional<Instance<typeof SchemaEventAttendanceModeEnumeration>> { // !!! type
	return mode === "offline" ? "OfflineEventAttendanceMode"
		: mode === "online" ? "OnlineEventAttendanceMode"
			: mode === "mixed" ? "MixedEventAttendanceMode"
				: undefined;
}
