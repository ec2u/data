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

import { toEventAttendanceModeString } from "@ec2u/data/pages/things/things";
import { DataInfo } from "@ec2u/data/views/info";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { boolean } from "@metreeca/core/boolean";
import { date } from "@metreeca/core/date";
import { dateTime } from "@metreeca/core/dateTime";
import { entry, toEntryString } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { string } from "@metreeca/core/string";
import { text, toTextString } from "@metreeca/core/text";
import { useCollection } from "@metreeca/data/models/collection";
import { useKeywords } from "@metreeca/data/models/keywords";
import { useOptions } from "@metreeca/data/models/options";
import { useRange } from "@metreeca/data/models/range";
import { useStats } from "@metreeca/data/models/stats";
import { icon } from "@metreeca/view";
import { TileClear } from "@metreeca/view/lenses/clear";
import { TileCount } from "@metreeca/view/lenses/count";
import { TileOptions } from "@metreeca/view/lenses/options";
import { TileRange } from "@metreeca/view/lenses/range";
import { TileSheet } from "@metreeca/view/lenses/sheet";
import { TileCard } from "@metreeca/view/widgets/card";
import { Calendar } from "@metreeca/view/widgets/icon";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileSearch } from "@metreeca/view/widgets/search";
import * as React from "react";


export const Events=immutable({

	[icon]: <Calendar/>,

	id: required("/events/"),

	label: required({
		"en": "Events"
	}),

	members: multiple({

		id: required(id),
		label: required(text),
		comment: optional(text),

		image: optional({
			url: required(id),
			author: optional(string),
			description: optional(text)
		}),

		startDate: required(dateTime),
		endDate: optional(dateTime),

		university: optional({
			id: required(id),
			label: required(text)
		})

	})

});


export function DataEvents() {

	const events=useCollection(Events, "members");

	return <DataPage name={Events} menu={<DataInfo/>}

		tray={<>

			<TileSearch placeholder={"Name"}>{
				useKeywords(events, "label")
			}</TileSearch>


			<TileOptions placeholder={"University"}>{
				useOptions(events, "university")
			}</TileOptions>

			<TileRange placeholder={"Date"}>{
				useRange(events, "startDate", { type: date.cast(dateTime) })
			}</TileRange>

			<TileOptions placeholder={"Free"} compact>{
				useOptions(events, "isAccessibleForFree", { type: boolean })
			}</TileOptions>

			<TileOptions placeholder={"Attendance"} compact as={toEventAttendanceModeString}>{
				useOptions(events, "eventAttendanceMode", { type: string })
			}</TileOptions>

			<TileOptions placeholder={"Topic"} compact>{
				useOptions(events, "about", { type: entry({ id: "", label: required(text) }), size: 10 })
			}</TileOptions>

			<TileOptions placeholder={"Audience"} compact>{
				useOptions(events, "audience", { type: entry({ id: "", label: required(text) }), size: 10 })
			}</TileOptions>

		</>}

		info={<>

			<TileCount>{useStats(events)}</TileCount>
			<TileClear>{events}</TileClear>

		</>}

	>

		<TileSheet placeholder={Events[icon]}

			sorted={{

				startDate: "increasing",
				label: "increasing"

			}}

			as={({

				id,
				label,
				comment,
				image,

				startDate,
				endDate,

				university

			}) => {

				const start=startDate.substring(0, 10);
				const end=endDate?.substring(0, 10);

				return <TileCard key={id} side={"end"} size={10}

					title={<TileLink>{{

						id,
						label: `${start}${end && end !== start ? ` › ${end}` : ""} / ${toTextString(label)}`

					}}</TileLink>}

					image={image?.url} // !!! alt text
					tags={university && <span>{toEntryString(university)}</span>}

				>{

					comment && toTextString(comment)

				}</TileCard>;
			}

			}>{events}</TileSheet>

	</DataPage>;

}

