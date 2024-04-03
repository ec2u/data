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

import { DataInfo } from "@ec2u/data/pages/meta";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { decimal } from "@metreeca/core/decimal";
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
import { ToolKeywords } from "@metreeca/view/lenses/keywords";
import { ToolOptions } from "@metreeca/view/lenses/options";
import { ToolRange } from "@metreeca/view/lenses/range";
import { ToolSheet } from "@metreeca/view/lenses/sheet";
import { ToolCard } from "@metreeca/view/widgets/card";
import { GraduationCap } from "@metreeca/view/widgets/icon";
import { ToolLink } from "@metreeca/view/widgets/link";
import * as React from "react";
import { duration, toDurationString } from "../../../../../../../../Products/Tool/code/core/duration";


export const Programs=immutable({

	[icon]: <GraduationCap/>,

	id: required("/programs/"),

	label: required({
		"en": "Programs"
	}),

	members: multiple({

		id: required(id),
		label: required(local),
		comment: optional(local),

		owner: optional({
				id: required(id),
				label: required(local)
			}
		)

	})

});


export function DataPrograms() {

	const programs=useCollection(Programs, "members");


	return <DataPage name={Programs} menu={<DataInfo/>}

		tray={< >

			<ToolKeywords placeholder={"Name"}>{
				useKeywords(programs, "label")
			}</ToolKeywords>


			<ToolOptions placeholder={"University"}>{
				useOptions(programs, "owner", { type: entry({ id: "", label: required(local) }) })
			}</ToolOptions>

			<ToolOptions placeholder={"Level"}>{
				useOptions(programs, "educationalLevel", { type: entry({ id: "", label: required(local) }) })
			}</ToolOptions>

			<ToolRange placeholder={"Credits"}>{
				useRange(programs, "numberOfCredits", { type: decimal })
			}</ToolRange>

			<ToolOptions placeholder={"Duration"} compact as={value => toDurationString(duration.decode(value))}>{
				useOptions(programs, "timeToComplete", { type: string }) // !!! duration >> range
			}</ToolOptions>

			<ToolOptions placeholder={"Title Awarded"} compact>{
				useOptions(programs, "educationalCredentialAwarded", { type: local, size: 10 })
			}</ToolOptions>

			<ToolOptions placeholder={"Provider"} compact>{
				useOptions(programs, "provider", { type: entry({ id: "", label: required(local) }), size: 10 })
			}</ToolOptions>

		</>}

		info={<>

			<ToolCount>{useStats(programs)}</ToolCount>
			<ToolClear>{programs}</ToolClear>

		</>}

	>

		<ToolSheet placeholder={Programs[icon]} as={({

			id,
			label,
			comment,

			owner

		}) =>

			<ToolCard key={id} side={"end"}

				title={<ToolLink>{{ id, label }}</ToolLink>}
				tags={owner && toEntryString(owner)}

			>{

				comment && toLocalString(comment)

			}</ToolCard>

		}>{programs}</ToolSheet>;

	</DataPage>;
}

