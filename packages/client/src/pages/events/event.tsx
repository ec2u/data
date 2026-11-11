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
import { Markdown } from "@metreeca/clay-markdown/markdown";
import { Button } from "@metreeca/clay-widgets/button";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Heading } from "@metreeca/clay-widgets/heading";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Image } from "@metreeca/clay-widgets/image";
import { Infobox } from "@metreeca/clay-widgets/infobox";
import { Link } from "@metreeca/clay-widgets/link";
import { Path } from "@metreeca/clay-widgets/path";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { isArray, isNumber, isObject, isString, opt } from "@metreeca/core";
import { nameTag } from "@metreeca/core/language";
import { useResource } from "@metreeca/tile/resource";
import { date } from "@metreeca/tile/types/date";
import { instant } from "@metreeca/tile/types/instant";
import { time } from "@metreeca/tile/types/time";
import { type ComponentChildren, createElement } from "preact";
import { useEffect } from "preact/hooks";
import { AI } from "../../widgets/ai.js";
import { Failure } from "../../widgets/failure.js";
import { address, filters, local } from "../../widgets/links.js";
import { Page } from "../../widgets/page.js";
import { DatasetLink } from "../datasets/dataset.js";
import "./event.css";
import { toEventAttendanceMode, toEventStatus } from "./index.core.js";
import { events } from "./index.js";


/**
 * The day an instant falls on.
 */
const day = instant.as(date);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function EventPage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({

		entry: route,
		shape: Event,

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
					latitude: {},
					longitude: {},
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

			university: { id: {}, altLabel: {} },
			publisher: { id: {}, label: {}, url: {} },
			keywords: { id: {}, label: {} }

		}

	});

	const title = resource({

		blank: events.label,
		error: events.label,

		ready: ({ state }) => state.label

	});


	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link href={events.route}>{events.label}</Link>

		</Path>}

		menu={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLink href={events.route}/>)}

		tray={resource({

			ready: ({

				state: {

					university,

					keywords = [],

					startDate,
					endDate,

					inLanguage,
					eventAttendanceMode,
					isAccessibleForFree,
					eventStatus,
					location,

					publisher,

					url

				}

			}) => <Infobox>{[

				{
					University: opt(university, value => <Link href={value.id}>{value.altLabel}</Link>)
				},

				{
					Topics: filters(keywords, events.route, keywords => ({
						...opt(university, ({ id }) => ({ university: id })),
						keywords
					}))
				},

				period(startDate, endDate),

				{
					Language: opt(inLanguage, tag => nameTag(tag, navigator.language)),
					Attendance: opt(eventAttendanceMode, toEventAttendanceMode),
					Fees: opt(isAccessibleForFree, free => free ? "Free" : "Paid"),
					Status: opt(eventStatus, toEventStatus),
					Location: opt(location, venue)
				},

				{
					Publisher: opt(publisher, ({ id, label, url = [] }) => <Link href={url[0] ?? id}>{label}</Link>)
				},

				{
					Web: url.length > 0 ? <ul>{url.map(url =>
						<li key={url}>{address(url, local(university?.id))}</li>
					)}</ul> : undefined
				}

			]}</Infobox>

		})}

		more={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Empty look={"subtle"}>{events.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{events.glyph}</Empty></Failure>,

		ready: ({ state: { label, description, disambiguatingDescription, image } }) => <>

			<Heading>{label}</Heading>

			{opt(image, ({ url, description, copyrightNotice }) => <Image float={"end"} within={"20rem"}
				src={url[0]}
				alt={description ?? `Image of ${label}`}
				caption={copyrightNotice}
			/>)}

			{opt(description, text => <Markdown>{text}</Markdown>) ?? disambiguatingDescription}

		</>

	})}</Page>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Lists the panel entries stating when an event takes place.
 *
 * @param start The instant the event starts at
 * @param end The instant the event ends at, if stated
 *
 * @returns A `Starts` entry with the day and time the event starts at, followed by an `Ends` entry with the day and
 *     time it ends at, where an end other than the start is stated; the end day is greyed out on a same-day event
 */
function period(start: string, end?: string): Readonly<Record<string, ComponentChildren>> {

	const from = day.format(start);
	const to = opt(end, value => day.format(value));

	return {
		Starts: `${from} ${clock(start)}`,
		Ends: end === undefined || end === start ? undefined
			: to === from ? <>{createElement("ec2u-same-day", {}, to)} {clock(end)}</>
				: `${to} ${clock(end)}`
	};

}

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
 * Renders the location of an event.
 *
 * @param location The location to be rendered
 *
 * @returns The venue text, the name and address of a place or postal address, or the link to a virtual location
 */
function venue(location: unknown): ComponentChildren {
	return isVirtual(location) ? address(location.url[0])
		: lines(parts(location));
}

/**
 * Lists the text parts of a venue, place or postal address.
 *
 * @param location The location to be listed
 *
 * @returns The comma-separated segments of a venue text, or the name of a place or postal address followed by its
 *     address parts, leaving out the ones not stated; nothing for any other value
 */
function parts(location: unknown): readonly string[] {
	return isString(location) ? location.split(",").map(part => part.trim()).filter(part => part.length > 0)
		: isPlace(location) ? [location.name, ...parts(location.address)].filter(isString)
			: isAddress(location) ? [
					location.name,
					location.streetAddress, location.postalCode, location.addressLocality, location.addressCountry
				].filter(isString)
				: [];
}

function isPlace(value: unknown): value is Record<PropertyKey, unknown> {
	return isObject(value) && isNumber(value.latitude) && isNumber(value.longitude);
}

function isAddress(value: unknown): value is Record<PropertyKey, unknown> {
	return isObject(value) && isString(value.addressLocality);
}

function isVirtual(value: unknown): value is { readonly url: readonly [string, ...string[]] } {
	return isObject(value) && value.latitude === undefined && value.addressLocality === undefined
		&& isArray(value.url, isString) && value.url.length > 0;
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
	return values.length === 0 ? undefined : values.flatMap((value, index) => index === 0 ? [value] : [
		<br key={index}/>, value]);
}
