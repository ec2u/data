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
import { Path } from "@metreeca/tile-cell/path";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useResource } from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { Info } from "@metreeca/tile-hive/info";
import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import { site } from "../../index.core.js";
import { AI } from "../../tiles/ai.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { events } from "./events.js";


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
		image: { url: {} },

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

		university: { id: {}, label: {} },
		publisher: { id: {}, label: {} },
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
					publisher

				}

			}) => <>

				<Info place={"spread"}>{{

					Source: <ul>{url.map(url => <li key={url}><Link look={"strong"} href={url}>{site(url)}</Link></li>)}</ul>

				}}</Info>

				<Info place={"spread"}>{{

					When: schedule(startDate, endDate),
					Where: opt(location, venue),
					Status: eventStatus,
					Attendance: eventAttendanceMode,
					Language: inLanguage,
					Free: opt(isAccessibleForFree, free => free ? "Yes" : "No")

				}}</Info>

				<Info place={"spread"}>{{

					University: opt(university, ({ id, label }) => <Link look={"strong"} href={id}>{label}</Link>),
					Publisher: opt(publisher, ({ id, label }) => <Link look={"strong"} href={id}>{label}</Link>)

				}}</Info>

			</>

		})}

		info={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Hint>{event.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{event.glyph}</Hint></Failure>,

		ready: ({ state: { label, description, disambiguatingDescription, image, keywords = [] } }) => <>

			<Card

				title={label}
				image={opt(image, ({ url }) => url[0])}

			>{description ?? disambiguatingDescription}</Card>

			<Info>{{

				Topics: keywords.length > 0 ? <ul>{keywords.map(({ id, label }) =>
					<li key={id}><Link href={id}>{label}</Link></li>
				)}</ul> : undefined

			}}</Info>

		</>

	})}</Page>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Formats the time span of an event for display.
 *
 * @param start The instant the event starts at
 * @param end The instant the event ends at, if stated
 *
 * @returns The start, followed by the end when one is stated, in the reader's locale
 */
export function schedule(start: string, end?: string): string {

	const format = (instant: string) => new Date(instant).toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short"
	});

	return end ? `${format(start)} – ${format(end)}` : format(start);

}

/**
 * Renders the location of an event.
 *
 * @param location The location to be rendered
 *
 * @returns The venue text, the name and address of a place or postal address, or the link to a virtual location
 */
function venue(location: NonNullable<Match<typeof Event, typeof event.model>["location"]>): ComponentChildren {
	return isString(location) ? location
		: "latitude" in location ? text(location.name, opt(location.address, venue))
			: "addressLocality" in location ? text(location.name,
					location.streetAddress, location.postalCode, location.addressLocality, location.addressCountry
				)
				: <Link href={location.url[0]}>{site(location.url[0])}</Link>;
}

/**
 * Joins the parts of a location for display.
 *
 * @param parts The parts to be joined; only the text ones are shown, as union members keep their broad type
 *
 * @returns The text parts, comma-separated
 */
function text(...parts: readonly unknown[]): string {
	return parts.filter(isString).join(", ");
}
