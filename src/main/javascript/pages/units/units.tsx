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
import { entry } from "@metreeca/core/entry";
import { toFrameString } from "@metreeca/core/frame";
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
import { FlaskConical } from "@metreeca/view/widgets/icon";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileSearch } from "@metreeca/view/widgets/search";
import * as React from "react";


export const Units=immutable({

	[icon]: <FlaskConical/>,

	id: required("/units/"),

	label: required({
		"en": "Units"
	}),

	members: multiple({

		id: required(id),
		label: required(text),
		comment: optional(text),

		university: optional({
			label: required(text)
		})

	})

});


export function DataUnits() {

	const units=useCollection(Units, "members");


	return <DataPage name={Units} menu={<DataInfo/>}

		tray={<>

			<TileSearch placeholder={"Name"}>{
				useKeywords(units, "label")
			}</TileSearch>

			<TileOptions placeholder={"University"}>{
				useOptions(units, "university", { type: entry({ id: "", label: required(text) }) })
			}</TileOptions>

			<TileOptions placeholder={"Type"} compact>{
				useOptions(units, "classification", { type: entry({ id: "", label: required(text) }), size: 10 })
			}</TileOptions>

			<TileOptions placeholder={"Topic"} compact>{
				useOptions(units, "subject", { type: entry({ id: "", label: required(text) }), size: 10 })
			}</TileOptions>

		</>}

		info={<>

			<TileCount>{useStats(units)}</TileCount>
			<TileClear>{units}</TileClear>

		</>}
	>

		<TileSheet placeholder={Units[icon]} as={({

			id,
			comment,
			label,

			university

		}) =>

			<TileCard key={id} side={"end"}

				title={<TileLink>{{ id, label }}</TileLink>}

				tags={university && <div>{toFrameString(university) || "EC2U Alliance"}</div>}

			>{

				comment && toTextString(comment)

			}</TileCard>

		}>{units}</TileSheet>

	</DataPage>;

}
