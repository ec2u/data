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

import { Events } from "@ec2u/data/pages/events/events";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { boolean } from "@metreeca/core/boolean";
import { toDateString } from "@metreeca/core/date";
import { dateTime } from "@metreeca/core/dateTime";
import { toEntryString } from "@metreeca/core/entry";
import { local, toLocalString } from "@metreeca/core/local";
import { reference, toReferenceString } from "@metreeca/core/reference";
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

	image: optional(reference),
	label: required(local),
	comment: required(local),

	university: {
		id: required(reference),
		label: required(local)
	},

	publisher: {
		id: required(reference),
		label: required(local)
	},

	source: optional(reference),

	name: required(local),
	url: multiple(reference),

	fullDescription: required(local),

	startDate: optional(dateTime),
	endDate: optional(dateTime),

	subject: multiple({
		id: required(reference),
		label: required(local)
	}),

	isAccessibleForFree: optional(boolean),

	// location: multiple({
	// 	id: required(reference),
	// 	label: required(local),
	// 	url: optional(reference)
	// }),

	organizer: multiple({
		id: required(reference),
		label: required(local),
		url: optional(reference)
	})

});


export function DataEvent() {

	const [event]=useResource({ ...Event, id: "" });

	return <DataPage name={[Events, event]}

		tray={<ToolFrame as={({

			university,
			publisher,
			source,

			name,
			url,

			startDate,
			endDate,

			subject,

			isAccessibleForFree,
			// !!! location,
			organizer

		}) => <>

			<ToolInfo>{{

				"University": <ToolLink>{university}</ToolLink>,

				"Source": source
					? <a href={source} title={toEntryString(publisher)}>{toEntryString(publisher)}</a>
					: <span title={toEntryString(publisher)}>{toEntryString(publisher)}</span>

			}}</ToolInfo>

			<ToolInfo>{{

				"Title": <span title={toLocalString(name)}>{toLocalString(name)}</span>,

				"Topics": subject && subject.length && <ul>{[...subject]
					.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
					.map(subject => <li key={subject.id}>
						<ToolLink filter={[Events, { university, subject }]}>{subject}</ToolLink>
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

				// "Location": location &&
				// [...location].sort((x, y) => string(x).localeCompare(string(y))).map(({ id, label, url }) => url ?
				// <a key={id}
				// href={url}>{string(label)}</a> : <span key={id}>{string(label)}</span>),

				"Organizer": organizer && [...organizer]
					.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
					.map(({ id, label, url }) => url
						? <a key={id} href={url}>{toLocalString(label)}</a>
						: <span key={id}>{toLocalString(label)}</span>
					),

				"Info": url && url.map(item => <a key={item} href={item}>{
					toReferenceString(item, { compact: true })
				}</a>)

			}}</ToolInfo>


		</>}>{event}</ToolFrame>}

	>

		<ToolFrame placeholder={Events[icon]} as={({

			image,
			label,

			fullDescription

		}) => <>

			{image && <img src={image} alt={`Image of ${toLocalString(label)}`} style={{

				float: "right",
				maxWidth: "33%",
				margin: "0 0 1rem 2rem"

			}}/>}

			<ToolMark>{toLocalString(fullDescription)}</ToolMark>

		</>}>{event}</ToolFrame>

	</DataPage>;

}