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

import { DataInfo } from "@ec2u/data/pages/datasets/dataset";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { duration, toDurationString } from "@metreeca/core/duration";
import { entry, toEntryString } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { local, toLocalString } from "@metreeca/core/local";
import { string } from "@metreeca/core/string";
import { useCollection } from "@metreeca/data/models/collection";
import { useKeywords } from "@metreeca/data/models/keywords";
import { useOptions } from "@metreeca/data/models/options";
import { useStats } from "@metreeca/data/models/stats";
import { icon } from "@metreeca/view";
import { ToolClear } from "@metreeca/view/lenses/clear";
import { ToolCount } from "@metreeca/view/lenses/count";
import { ToolOptions } from "@metreeca/view/lenses/options";
import { ToolSheet } from "@metreeca/view/lenses/sheet";
import { ToolCard } from "@metreeca/view/widgets/card";
import { GraduationCap } from "@metreeca/view/widgets/icon";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolSearch } from "@metreeca/view/widgets/search";
import * as React from "react";


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

		university: optional({
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

			<ToolSearch placeholder={"Name"}>{
				useKeywords(programs, "label")
			}</ToolSearch>


			<ToolOptions placeholder={"University"}>{
				useOptions(programs, "university", { type: entry({ id: "", label: required(local) }) })
			}</ToolOptions>

			<ToolOptions placeholder={"Level"}>{
				useOptions(programs, "educationalLevel", { type: entry({ id: "", label: required(local) }) })
			}</ToolOptions>

			<ToolOptions placeholder={"Duration"} compact as={value => toDurationString(duration.decode(value))}>{
				useOptions(programs, "timeToComplete", { type: string }) // !!! duration >> range
			}</ToolOptions>

			<ToolOptions placeholder={"Title Awarded"} compact>{
				useOptions(programs, "educationalCredentialAwarded", { type: local, size: 10 })
			}</ToolOptions>

			<ToolOptions placeholder={"Provider"} compact as={value => toEntryString(value)}>{
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

			university

		}) =>

			<ToolCard key={id} side={"end"}

				title={<ToolLink>{{ id, label }}</ToolLink>}
				tags={university && toEntryString(university)}

			>{

				comment && toLocalString(comment)

			}</ToolCard>

		}>{programs}</ToolSheet>

	</DataPage>;
}

