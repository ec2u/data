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

import { LabelLength } from "@ec2u/data-shared";
import { Event, events, getEventId, type Publisher } from "@ec2u/data-shared/events/index.js";
import { getUniversity } from "@ec2u/data-shared/universities/index.core.js";
import { SchemaEventAttendanceModeEnumeration } from "@ec2u/data-shared/vocabularies/schema/event.js";
import { SchemaLocation } from "@ec2u/data-shared/vocabularies/schema/location.js";
import type { State } from "@metreeca/blue/value";
import { opt, type Optional } from "@metreeca/core";
import { multiple, nonempty, optional } from "@metreeca/core/arrays";
import type { Awaitable } from "@metreeca/core/async";
import { clip, tidy } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { filter, map } from "@metreeca/flow/tasks";
import { validate } from "@metreeca/mime-jsonld";
import type { Classified } from "./classify.js";

export function convert(
	publisher: Pick<Publisher, "id" | "university">,
	city?: Awaitable<Optional<string>>
): Task<State<typeof Classified>, State<typeof Event>> {

	const university = getUniversity(publisher.university);

	return payloads => pipe(
		(items(payloads))
		(filter(payload => payload.event))
		(map(async payload => {

			const url = payload.url;

			const title = clip(tidy(payload.title), LabelLength);
			const localTitle = opt(payload.localTitle, localTitle => clip(tidy(localTitle), LabelLength));

			const startDate = payload.startDate;
			const endDate = payload.endDate;
			const endTime = payload.endTime;

			const attendanceURL = payload.attendanceURL;
			const venueName = line(payload.venueName);
			const venueAddress = line(payload.venueAddress);
			const venueCity = line(payload.venueCity);

			// an address is told apart by its locality, so a document naming a venue but no city places it in the city
			// of the university publishing it; a document naming no venue at all is left with no location to place

			const addressLocality = venueCity ?? await opt(venueName ?? venueAddress, () => city);

			return immutable({

				generated: true,

				id: getEventId(url),
				url: nonempty(url),

				dataset: events.id,

				university: university.id,
				publisher: publisher.id,

				label: title,

				keywords: multiple(payload.keywords),

				name: texts(payload.language, title, localTitle),
				description: texts(payload.language, payload.description, payload.localDescription),
				disambiguatingDescription: opt(payload.summary, summary =>
					texts(payload.language, summary, payload.localSummary)
				),

				startDate: stamp(startDate, payload.startTime, university.zone),

				endDate: optional(endDate === undefined && endTime === undefined
					? undefined
					: stamp(endDate ?? startDate, endTime, university.zone)
				),

				inLanguage: payload.language,

				isAccessibleForFree: opt(payload.entryFees, fees => fees === "free"),
				eventAttendanceMode: opt(payload.attendanceMode, attendance),

				image: opt(payload.imageURL, url => ({
					url: nonempty(url),
					copyrightNotice: line(payload.imageCredits)
				})),

				location: optional<State<typeof SchemaLocation>>(
					opt(attendanceURL, url => ({ url: [url] }))
					?? opt(addressLocality, addressLocality => ({
						name: venueName,
						streetAddress: venueAddress,
						addressLocality
					}))
					?? venueName
					?? venueAddress
				)

			});

		}))
		(validate(Event))
	);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// a plain text slot admits a single unformatted line, so a value the model pads, runs together or wraps is folded
// before it is stated and one left with nothing is dropped

function line(value: Optional<string>): Optional<string> {

	const folded = opt(value, tidy);

	return folded === undefined || folded.length === 0 ? undefined : folded;

}


// every text is stated in English, and also in the document's own language where that differs and was extracted

function texts(language: string, english: string, local: Optional<string>): { readonly [tag: string]: string } {
	return language === "en" || local === undefined
		? { en: english }
		: { en: english, [language]: local };
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


function attendance(mode: string): Optional<State<typeof SchemaEventAttendanceModeEnumeration>> { // !!! type
	return mode === "offline" ? "OfflineEventAttendanceMode"
		: mode === "online" ? "OnlineEventAttendanceMode"
			: mode === "mixed" ? "MixedEventAttendanceMode"
				: undefined;
}
