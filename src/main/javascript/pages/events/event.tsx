/*
 * Copyright © 2020-2025 EC2U Alliance
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

import { Languages } from "@ec2u/data/languages";
import { Events } from "@ec2u/data/pages/events/events";
import { DataAI } from "@ec2u/data/views/ai";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { boolean } from "@metreeca/core/boolean";
import { toDateString } from "@metreeca/core/date";
import { dateTime } from "@metreeca/core/dateTime";
import { entryCompare, isEntry, toEntryString } from "@metreeca/core/entry";
import { id, toIdString } from "@metreeca/core/id";
import { string } from "@metreeca/core/string";
import { text, toTextString } from "@metreeca/core/text";
import { toTimeString } from "@metreeca/core/time";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { TileFrame } from "@metreeca/view/lenses/frame";
import { TileInfo } from "@metreeca/view/widgets/info";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileMark } from "@metreeca/view/widgets/mark";
import React from "react";

export const Event=immutable({

	id: required("/events/{code}"),

	generated: optional(boolean),

	url: multiple(id),
	name: required(text),
	description: optional(text),

	image: optional({
		id: required(id),
		url: required(id),
		author: optional(string),
		description: optional(text)
	}),

	startDate: optional(dateTime),
	endDate: optional(dateTime),

	inLanguage: optional(string),
	isAccessibleForFree: optional(boolean),

	eventAttendanceMode: optional({
		id: required(id),
		label: required(text)
	}),

	eventStatus: optional({
		id: required(id),
		label: required(text)
	}),

	about: multiple({
		id: required(id),
		label: required(text)
	}),

	audience: multiple({
		id: required(id),
		label: required(text)
	}),

	organizer: multiple({
		id: required(id),
		label: required(text),
		url: optional(id)
	}),

	publisher: optional({

		id: required(id),
		label: required(text),
		url: optional(id),

		about: multiple({
			id: required(id),
			label: required(text)
		})

	}),

	location: multiple({

		Text: optional(string),

		Place: optional({
			label: required(text),
			url: optional(id),
			address: optional({
				streetAddress: optional(string),
				postalCode: optional(string),
				addressLocality: optional(string)
			})
		}),

		PostalAddress: optional({
			streetAddress: optional(string),
			postalCode: optional(string),
			addressLocality: optional(string)
		}),

		VirtualLocation: optional({
			label: required(text),
			url: required(id)
		})

	}),

	university: optional({
		id: required(id),
		label: required(text)
	})

});


type Place=Exclude<Exclude<typeof Event.location, undefined>[number]["Place"], undefined>
type PostalAddress=Exclude<Exclude<typeof Event.location, undefined>[number]["PostalAddress"], undefined>

function asPlace(place: Place) {
	return <div>
		<span>{toTextString(place.label)}</span>
		{place.address && asPostalAddress(place.address)}
	</div>;
}

function asPostalAddress(address: PostalAddress) {
	return <div>
		{address.streetAddress && <span>{address.streetAddress}</span>}
		{address.addressLocality && <span>{address.postalCode} {
			isEntry(address.addressLocality)
				? <TileLink>{address.addressLocality}</TileLink>
				: address.addressLocality}</span>
		}
	</div>;
}


export function DataEvent() {

	const [event]=useResource(Event);

	return <DataPage name={[Events, {}]} info={<DataAI>{event?.generated}</DataAI>}

		tray={<TileFrame as={({

			url,

			startDate,
			endDate,

			about,
			audience,

			inLanguage,
			isAccessibleForFree,

			eventAttendanceMode,
			eventStatus,

			organizer,
			publisher,
			location,

			university

		}) => <>

			<TileInfo>{{

				"University": university && <TileLink>{university}</TileLink>

			}}</TileInfo>

			<TileInfo>{{

				"Topics": about?.length && <ul>{[...about]
					.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
					.map(about => <li key={about.id}>
						<TileLink filter={[Events, { university, about }]}>{about}</TileLink>
					</li>)
				}</ul>,

				"Audience": audience?.length && <ul>{[...audience]
					.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
					.map(audience => <li key={audience.id}>
						<TileLink filter={[Events, { university, audience }]}>{audience}</TileLink>
					</li>)
				}</ul>

			}}</TileInfo>

			<TileInfo>{{

				...(startDate && {
					"Start Date": toDateString(new Date(startDate)),
					"Start Time": toTimeString(new Date(startDate))

				}),

				...(endDate && endDate !== startDate && {

					"End Date": endDate?.substring(0, 10) !== startDate?.substring(0, 10) && toDateString(new Date(endDate)),
					"End Time": toTimeString(new Date(endDate))
				})

			}}</TileInfo>


			<TileInfo>{{

				"Entry": isAccessibleForFree === true ? "Free" : isAccessibleForFree === false ? "Paid" : undefined,
				"Language": inLanguage && toTextString(Languages[inLanguage]),

				"Attendance": eventAttendanceMode && toEntryString(eventAttendanceMode),
				"Status": eventStatus && toEntryString(eventStatus),

				"Location": location && <ul>{location?.map(({ Text, Place, PostalAddress, VirtualLocation }, index) =>

					<li key={index}>{

						Text ? <span>{Text}</span>
							: Place ? asPlace(Place)
								: PostalAddress ? asPostalAddress(PostalAddress)
									: VirtualLocation ?
										<a href={VirtualLocation.url}>{toTextString(VirtualLocation.label)}</a>
										: null

					}</li>
				)}</ul>

			}}</TileInfo>

			<TileInfo>{{

				"Info": url && url.map(item => <a key={item} href={item}>{
					toIdString(item, { compact: true })
				}</a>),

				"Organizer": organizer && organizer.slice().sort(entryCompare).map(({
						id, label, url
					}) => url
					? <a key={id} href={url}>{toTextString(label)}</a>
					: <span key={id}>{toTextString(label)}</span>
				),

				"Publisher": publisher && [publisher].map(({ id, label, url }) =>
					<a key={id} href={url || id}>{toTextString(label)}</a>
				),

				"Source": publisher?.about && <ul>{publisher.about.slice().sort(entryCompare)
					.map(about => <li key={about.id}>
						<TileLink>{about}</TileLink>
					</li>)
				}</ul>

			}}</TileInfo>


		</>}>{event}</TileFrame>}

	>

		<TileFrame placeholder={Events[icon]} as={({

			name,
			description,
			image

		}) => <>

			{image && <figure style={{

				float: "right",
				maxWidth: "33%",
				margin: "0 0 1rem 2rem"

			}}>

                <img src={image.url}

                    alt={image.description && toTextString(image.description) || `Image of ${toTextString(name)}`}

                    style={{
						margin: 0
					}}
                />

				{image.author && <figcaption style={{
					marginTop: "0.75em",
					textAlign: "right",
					fontStyle: "italic",
					fontSize: "90%"
				}}>Photo by {image.author}</figcaption>}

            </figure>}

			<dfn>{toTextString(name)}</dfn>

			{description && <TileMark>{toTextString(description)}</TileMark>}

		</>}>{event}</TileFrame>

	</DataPage>;

}