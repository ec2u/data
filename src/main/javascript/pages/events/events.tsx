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

import { DataInfo } from "@ec2u/data/pages/datasets/dataset";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { boolean } from "@metreeca/core/boolean";
import { date } from "@metreeca/core/date";
import { dateTime } from "@metreeca/core/dateTime";
import { entry, toEntryString } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { local, toLocalString } from "@metreeca/core/local";
import { string } from "@metreeca/core/string";
import { useCollection } from "@metreeca/data/models/collection";
import { useKeywords } from "@metreeca/data/models/keywords";
import { useOptions } from "@metreeca/data/models/options";
import { useRange } from "@metreeca/data/models/range";
import { useStats } from "@metreeca/data/models/stats";
import { icon } from "@metreeca/view";
import { ToolClear } from "@metreeca/view/lenses/clear";
import { ToolCount } from "@metreeca/view/lenses/count";
import { ToolOptions } from "@metreeca/view/lenses/options";
import { ToolRange } from "@metreeca/view/lenses/range";
import { ToolSheet } from "@metreeca/view/lenses/sheet";
import { ToolCard } from "@metreeca/view/widgets/card";
import { Calendar } from "@metreeca/view/widgets/icon";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolSearch } from "@metreeca/view/widgets/search";
import * as React from "react";


export const Events=immutable({

	[icon]: <Calendar/>,

	id: required("/events/"),

	label: required({
		"en": "Events"
	}),

	members: multiple({

		id: required(id),
		label: required(local),
		comment: optional(local),

		image: optional({
			id: required(id),
			url: required(id),
			author: optional(string),
			description: optional(local)
		}),

		startDate: required(dateTime),
		endDate: optional(dateTime),

		university: optional({
			id: required(id),
			label: required(local)
		})

	})

});


export function DataEvents() {

	const events=useCollection(Events, "members");

	return <DataPage name={Events} menu={<DataInfo/>}

		tray={<>

			<ToolSearch placeholder={"Name"}>{
				useKeywords(events, "label")
			}</ToolSearch>


			<ToolOptions placeholder={"University"}>{
				useOptions(events, "university")
			}</ToolOptions>

			<ToolRange placeholder={"Date"}>{
				useRange(events, "startDate", { type: date.cast(dateTime) })
			}</ToolRange>

			<ToolOptions placeholder={"Free"} compact>{
				useOptions(events, "isAccessibleForFree", { type: boolean })
			}</ToolOptions>

			<ToolOptions placeholder={"Topic"} compact>{
				useOptions(events, "about", { type: entry({ id: "", label: required(local) }), size: 10 })
			}</ToolOptions>

			<ToolOptions placeholder={"Audience"} compact>{
				useOptions(events, "audience", { type: entry({ id: "", label: required(local) }), size: 10 })
			}</ToolOptions>

			<ToolOptions placeholder={"Organizer"} compact>{
				useOptions(events, "organizer", { type: entry({ id: "", label: required(local) }), size: 10 })
			}</ToolOptions>

			<ToolOptions placeholder={"Publisher"} compact>{
				useOptions(events, "publisher", { type: entry({ id: "", label: required(local) }), size: 10 })
			}</ToolOptions>

			<ToolOptions placeholder={"Source"} compact>{
				useOptions(events, "publisher.about", { type: entry({ id: "", label: required(local) }), size: 10 })
			}</ToolOptions>

		</>}

		info={<>

			<ToolCount>{useStats(events)}</ToolCount>
			<ToolClear>{events}</ToolClear>

		</>}

	>

		<ToolSheet placeholder={Events[icon]}

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

				return <ToolCard key={id} side={"end"} size={10}

					title={<ToolLink>{{

						id,
						label: `${start}${end && end !== start ? ` › ${end}` : ""} / ${toLocalString(label)}`

					}}</ToolLink>}

					image={image?.url} // !!! alt text
					tags={university && <span>{toEntryString(university)}</span>}

				>{

					comment && toLocalString(comment)

				}</ToolCard>;
			}

			}>{events}</ToolSheet>

	</DataPage>;

}

