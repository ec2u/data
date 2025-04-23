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
import { ec2u } from "@ec2u/data/views";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { entry, toEntryString } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
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
import { Package } from "@metreeca/view/widgets/icon";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileSearch } from "@metreeca/view/widgets/search";
import * as React from "react";


export const Resources=immutable({

	[icon]: <Package/>,

	id: required("/resources/"),

	label: required({
		"": "Resources"
	}),

	isDefinedBy: optional(id),

	members: multiple({

		id: required(id),
		label: required(text),
		comment: optional(text),

		university: optional(({
			id: required(id),
			label: required(text)
		}))

	})

});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataResources() {

	const resources=useCollection(Resources, "members");

	return <DataPage name={Resources} menu={<DataInfo/>}

		tray={<>

			<TileSearch placeholder={"Name"}>{
				useKeywords(resources, "label")
			}</TileSearch>

			<TileOptions placeholder={"University"}>{
				useOptions(resources, "university")
			}</TileOptions>

			<TileOptions placeholder={"Dataset"} as={({ id, label }) =>
				<TileLink>{{ id, label: ec2u(label) }}</TileLink>
			}>{
				useOptions(resources, "dataset", { type: entry })
			}</TileOptions>

			<TileOptions placeholder={"Concept"} compact>{
				useOptions(resources, "concept", { type: entry })
			}</TileOptions>

		</>}

		info={<>

			<TileCount>{useStats(resources)}</TileCount>
			<TileClear>{resources}</TileClear>

		</>}

	>

		<TileSheet placeholder={Resources[icon]} sorted={"label"} as={({

			id,
			label,
			comment,

			university

		}) =>

			<TileCard key={id} side={"end"}

				title={<TileLink>{{ id, label }}</TileLink>}
				tags={university && <span>{toEntryString(university)}</span>}

			>{

				comment && toTextString(comment)

			}</TileCard>

		}>{resources}</TileSheet>

	</DataPage>;
}
