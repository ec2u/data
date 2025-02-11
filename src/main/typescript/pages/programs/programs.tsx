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

import { DataInfo } from "@ec2u/data/views/info";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { entry, toEntryString } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { period } from "@metreeca/core/period";
import { text, toTextString } from "@metreeca/core/text";
import { useCollection } from "@metreeca/data/models/collection";
import { useKeywords } from "@metreeca/data/models/keywords";
import { useOptions } from "@metreeca/data/models/options";
import { useStats } from "@metreeca/data/models/stats";
import { icon } from "@metreeca/view";
import { TileClear } from "@metreeca/view/lenses/clear";
import { TileCount } from "@metreeca/view/lenses/count";
import { TileOptions } from "@metreeca/view/lenses/options";
import { TileSheet } from "@metreeca/view/lenses/sheet";
import { TileCard } from "@metreeca/view/widgets/card";
import { GraduationCap } from "@metreeca/view/widgets/icon";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileSearch } from "@metreeca/view/widgets/search";
import * as React from "react";


export const Programs=immutable({

	[icon]: <GraduationCap/>,

	id: required("/programs/"),

	label: required({
		"en": "Programs"
	}),

	members: multiple({

		id: required(id),
		label: required(text),
		comment: optional(text),

		university: optional({
			id: required(id),
			label: required(text)
		})

	})

});


export function DataPrograms() {

	const programs=useCollection(Programs, "members");


	return <DataPage name={Programs} menu={<DataInfo/>}

		tray={< >

			<TileSearch placeholder={"Name"}>{
				useKeywords(programs, "label")
			}</TileSearch>


			<TileOptions placeholder={"University"}>{
				useOptions(programs, "university", { type: entry({ id: "", label: required(text) }) })
			}</TileOptions>

			<TileOptions placeholder={"Level"}>{
				useOptions(programs, "educationalLevel", { type: entry({ id: "", label: required(text) }) })
			}</TileOptions>

			<TileOptions placeholder={"Duration"} compact>{
				useOptions(programs, "timeToComplete", { type: period }) // !!! period >> range
			}</TileOptions>

			<TileOptions placeholder={"Subjects"} compact>{
				useOptions(programs, "about", { type: entry({ id: "", label: required(text) }), size: 10 })
			}</TileOptions>

			<TileOptions placeholder={"Provider"} compact as={value => toEntryString(value)}>{
				useOptions(programs, "provider", { type: entry({ id: "", label: required(text) }), size: 10 })
			}</TileOptions>

		</>}

		info={<>

			<TileCount>{useStats(programs)}</TileCount>
			<TileClear>{programs}</TileClear>

		</>}

	>

		<TileSheet placeholder={Programs[icon]} as={({

			id,
			label,
			comment,

			university

		}) =>

			<TileCard key={id} side={"end"}

				title={<TileLink>{{ id, label }}</TileLink>}
				tags={university && toEntryString(university)}

			>{

				comment && toTextString(comment)

			}</TileCard>

		}>{programs}</TileSheet>

	</DataPage>;
}

