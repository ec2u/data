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

import { Event } from "@ec2u/data-shared/events/index.js";
import type { Match } from "@metreeca/blue/value";
import { isString, opt } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { Mark } from "@metreeca/tile-cell/mark";
import { Path } from "@metreeca/tile-cell/path";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useResource } from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { Info } from "@metreeca/tile-hive/info";
import { date } from "@metreeca/tile-type/date";
import { instant } from "@metreeca/tile-type/instant";
import { time } from "@metreeca/tile-type/time";
import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import { scope, site, toEventAttendanceMode, toEventStatus, toLanguage, toUniversity, UniversityModel } from "../../index.core.js";
import { AI } from "../../tiles/ai.js";
import { Failure } from "../../tiles/failure.js";
import { filters } from "../../tiles/links.js";
import { Page } from "../../tiles/page.js";
import { events } from "./events.js";


/**
 * The day an instant falls on.
 */
const day = date({ instant: true });


export const event = immutable({

	route: "/:event",
	label: "Event",
	glyph: <Icon.Calendar/>,

	model: {

		id: {},
		generated: {},

		label: {},
		description: {},
		disambiguatingDescription: {},

		url: {},
		image: { url: {}, description: {}, copyrightNotice: {} },

		startDate: {},
		endDate: {},

		inLanguage: {},
		isAccessibleForFree: {},
		eventStatus: {},
		eventAttendanceMode: {},

		location: {

			"0": {}, // a venue stated as plain text

			"1": { // a place, a postal address or a virtual location
				name: {},
				url: {},
				addressLocality: {},
				streetAddress: {},
				postalCode: {},
				addressCountry: {},
				address: {
					addressLocality: {},
					streetAddress: {},
					postalCode: {},
					addressCountry: {}
				}
			}

		},

		university: UniversityModel,
		publisher: { id: {}, label: {}, url: {} },
		keywords: { id: {}, label: {} }

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function EventPage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({
		entry: route,
		shape: Event,
		model: event.model
	});

	const title = resource({

		blank: events.label,
		error: events.label,

		ready: ({ state }) => state.label

	});

	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link look={"subtle"} href={events.route}>{events.label}</Link>

		</Path>}

		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={resource({

			ready: ({

				state: {

					url,

					startDate,
					endDate,

					inLanguage,
					isAccessibleForFree,

					eventStatus,
					eventAttendanceMode,

					location,
					university,
					publisher,

					keywords = []

				}

			}) => <>

				<Info place={"spread"}>{{

					University: opt(university, value => <Link look={"strong"} href={value.id}>{toUniversity(value)}</Link>)

				}}</Info>

				<Info place={"spread"}>{{

					Topics: filters(keywords, events.route, keywords => ({ ...scope(university), keywords }))

				}}</Info>

				<Info place={"spread"}>{{

					"Start Date": day.format(startDate),
					"Start Time": clock(startDate),

					...(endDate === undefined || endDate === startDate ? {} : {
						"End Date": day.format(endDate) === day.format(startDate) ? undefined : day.format(endDate),
						"End Time": clock(endDate)
					})

				}}</Info>

				<Info place={"spread"}>{{

					Entry: opt(isAccessibleForFree, free => free ? "Free" : "Paid"),
					Language: opt(inLanguage, toLanguage),
					Attendance: opt(eventAttendanceMode, toEventAttendanceMode),
					Status: opt(eventStatus, toEventStatus),
					Location: opt(location, venue)

				}}</Info>

				<Info place={"spread"}>{{

					Info: <ul>{url.map(url => <li key={url}><Link look={"strong"} href={url}>{site(url)}</Link></li>)}</ul>,
					Publisher: opt(publisher, ({ id, label, url = [] }) => <Link look={"strong"} href={url[0] ?? id}>{label}</Link>)

				}}</Info>

			</>

		})}

		info={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Hint>{event.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{event.glyph}</Hint></Failure>,

		ready: ({ state: { label, description, disambiguatingDescription, image } }) => <Card

			title={label}

			image={opt(image, ({ url, description: alt }) => <img src={url[0]} alt={alt ?? `Image of ${label}`}/>)}
			caption={image?.copyrightNotice}

		>{opt(description, text => <Mark>{text}</Mark>) ?? disambiguatingDescription}</Card>

	})}</Page>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Formats the time of day an instant falls on for display.
 *
 * @param value The instant to be formatted
 *
 * @returns The wall-clock time of `value` in the runtime time zone, in the reader's locale
 */
function clock(value: string): string {
	return time.format(instant.write(value).slice("YYYY-MM-DDT".length)); // the local wall-clock time of the instant
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Formats the days an event spans for display.
 *
 * @param start The instant the event starts at
 * @param end The instant the event ends at, if stated
 *
 * @returns The day the event starts on, followed by the day it ends on where it ends on another one, in the reader's
 *     locale
 */
export function schedule(start: string, end?: string): string {

	const from = day.format(start);
	const to = opt(end, value => day.format(value));

	return to === undefined || to === from ? from : `${from} › ${to}`;

}

/**
 * The location of an event, as retrieved for its page.
 */
type Location = NonNullable<Match<typeof Event, typeof event.model>["location"]>;

/**
 * Renders the location of an event.
 *
 * @param location The location to be rendered
 *
 * @returns The venue text, the name and address of a place or postal address, or the link to a virtual location
 */
function venue(location: Location): ComponentChildren {
	return isString(location) || "latitude" in location || "addressLocality" in location ? lines(parts(location))
			: <Link href={location.url[0]}>{site(location.url[0])}</Link>;
}

/**
 * Lists the text parts of a venue, place or postal address.
 *
 * @param location The location to be listed
 *
 * @returns The comma-separated segments of a venue text, or the name of a place or postal address followed by its
 *     address parts, leaving out the ones not stated
 */
function parts(location: Location): readonly string[] {
	return isString(location) ? location.split(",").map(part => part.trim()).filter(part => part.length > 0)
		: "latitude" in location ? [location.name, ...opt(location.address, parts) ?? []].filter(isString)
			: "addressLocality" in location ? [
					location.name,
					location.streetAddress, location.postalCode, location.addressLocality, location.addressCountry
				].filter(isString)
				: [];
}

/**
 * Sets the parts of a location for display.
 *
 * @param values The parts to be set
 *
 * @returns The parts separated by line breaks, so a long address is not clipped to a single line; nothing if no part
 *     is stated, so the panel leaves the location out rather than showing it as an empty entry
 */
function lines(values: readonly string[]): ComponentChildren {
	return values.length === 0 ? undefined : values.flatMap((value, index) => index === 0 ? [value] : [<br key={index}/>, value]);
}
