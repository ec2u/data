/*
 * Copyright © 2020-2024 EC2U Alliance
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
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { boolean } from "@metreeca/core/boolean";
import { toDateString } from "@metreeca/core/date";
import { dateTime } from "@metreeca/core/dateTime";
import { toEntryString } from "@metreeca/core/entry";
import { id, toIdString } from "@metreeca/core/id";
import { local, toLocalString } from "@metreeca/core/local";
import { string } from "@metreeca/core/string";
import { toTimeString } from "@metreeca/core/time";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import { ToolInfo } from "@metreeca/view/widgets/info";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolMark } from "@metreeca/view/widgets/mark";
import React from "react";


export const Event=immutable({

	id: required("/events/{code}"),
	label: required(local),

	url: multiple(id),
	name: required(local),
	description: optional(local),
	image: optional(id),

	startDate: optional(dateTime),
	endDate: optional(dateTime),

	inLanguage: optional(string),
	isAccessibleForFree: optional(boolean),

	eventAttendanceMode: optional({
		id: required(id),
		label: required(local)
	}),

	eventStatus: optional({
		id: required(id),
		label: required(local)
	}),

	about: multiple({
		id: required(id),
		label: required(local)
	}),

	audience: multiple({
		id: required(id),
		label: required(local)
	}),

	organizer: multiple({
		id: required(id),
		label: required(local),
		url: optional(id)
	}),

	publisher: optional({

		id: required(id),
		label: required(local),
		url: optional(id),

		about: multiple({
			id: required(id),
			label: required(local)
		})

	}),

	location: multiple({

		Text: optional(string),

		Place: optional({
			label: required(local),
			url: optional(id)
		}),

		PostalAddress: optional({
			label: required(local),
			url: optional(id)
		}),

		VirtualLocation: optional({
			label: required(local),
			url: required(id)
		})

	}),

	partner: optional({
		id: required(id),
		label: required(local)
	})

});


export function DataEvent() {

	const [event]=useResource(Event);

	return <DataPage name={[Events, event]}

		tray={<ToolFrame as={({

			url,
			name,

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

			partner

		}) => <>

			<ToolInfo>{{

				"University": partner && <ToolLink>{partner}</ToolLink>

			}}</ToolInfo>

			<ToolInfo>{{

				"Title": <span title={toLocalString(name)}>{toLocalString(name)}</span>,

				"Topics": about?.length && <ul>{[...about]
					.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
					.map(about => <li key={about.id}>
						<ToolLink filter={[Events, { partner, about }]}>{about}</ToolLink>
					</li>)
				}</ul>,

				"Audience": audience?.length && <ul>{[...audience]
					.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
					.map(audience => <li key={audience.id}>
						<ToolLink filter={[Events, { partner, audience }]}>{audience}</ToolLink>
					</li>)
				}</ul>

			}}</ToolInfo>

			<ToolInfo>{{

				...(startDate && {
					"Start Date": toDateString(new Date(startDate)),
					"Start Time": toTimeString(new Date(startDate))

				}),

				...(endDate && endDate !== startDate && {

					"End Date": endDate?.substring(0, 10) !== startDate?.substring(0, 10) && toDateString(new Date(endDate)),
					"End Time": toTimeString(new Date(endDate))
				})

			}}</ToolInfo>


			<ToolInfo>{{

				"Entry": isAccessibleForFree === true ? "Free" : isAccessibleForFree === false ? "Paid" : undefined,
				"Language": inLanguage && toLocalString(Languages[inLanguage]),

				"Attendance": eventAttendanceMode && toEntryString(eventAttendanceMode),
				"Status": eventStatus && toEntryString(eventStatus),

				"Location": location && <ul>{location?.map(({ Text, Place, VirtualLocation }, index) =>

					<li key={index}>{

						Text ? <span>{Text}</span>
							: Place ? <span>{toLocalString(Place.label)}</span>
								: VirtualLocation ? <a href={VirtualLocation.url}>{toLocalString(VirtualLocation.label)}</a>
									: null

					}</li>
				)}</ul>

			}}</ToolInfo>

			<ToolInfo>{{

				"Info": url && url.map(item => <a key={item} href={item}>{
					toIdString(item, { compact: true })
				}</a>),

				"Organizer": organizer && [...organizer]
					.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
					.map(({ id, label, url }) => url
						? <a key={id} href={url}>{toLocalString(label)}</a>
						: <span key={id}>{toLocalString(label)}</span>
					),

				"Publisher": publisher && [publisher].map(({ id, label, url }) =>
					<a key={id} href={url || id}>{toLocalString(label)}</a>
				),

				"Source": publisher?.about?.length && <ul>{[...publisher.about]
					.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
					.map(about => <li key={about.id}>
						<ToolLink>{about}</ToolLink>
					</li>)
				}</ul>

			}}</ToolInfo>


		</>}>{event}</ToolFrame>}

	>

		<ToolFrame placeholder={Events[icon]} as={({

			name,
			description,
			image

		}) => <>

			{image && <img src={image} alt={`Image of ${toLocalString(name)}`} style={{

				float: "right",
				maxWidth: "33%",
				margin: "0 0 1rem 2rem"

			}}/>}

			{description && <ToolMark>{toLocalString(description)}</ToolMark>}

		</>}>{event}</ToolFrame>

	</DataPage>;

}