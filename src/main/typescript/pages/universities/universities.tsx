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
import { immutable, multiple, repeatable, required } from "@metreeca/core";
import { toEntryString } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { integer } from "@metreeca/core/integer";
import { text, toTextString } from "@metreeca/core/text";
import { year } from "@metreeca/core/year";
import { useCollection } from "@metreeca/data/models/collection";
import { useKeywords } from "@metreeca/data/models/keywords";
import { useRange } from "@metreeca/data/models/range";
import { useStats } from "@metreeca/data/models/stats";
import { icon } from "@metreeca/view";
import { TileClear } from "@metreeca/view/lenses/clear";
import { TileCount } from "@metreeca/view/lenses/count";
import { TileRange } from "@metreeca/view/lenses/range";
import { TileSheet } from "@metreeca/view/lenses/sheet";
import { TileCard } from "@metreeca/view/widgets/card";
import { Landmark } from "@metreeca/view/widgets/icon";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileSearch } from "@metreeca/view/widgets/search";
import * as React from "react";


export const Universities=immutable({

	[icon]: <Landmark/>,

	id: required("/universities/"),

	label: required({
		en: "Universities",
		it: "Università"
	}),

	members: multiple({

		id: required(id),

		prefLabel: required(text),
		comment: required(text),
		depiction: repeatable(id),

		country: required({
			id: required(id),
			label: required(text)
		})

	})
});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataUniversities() {

	const universities=useCollection(Universities, "members");

	return <DataPage name={Universities} menu={<DataInfo/>}

		tray={<>

			<TileSearch placeholder={"Name"}>{
				useKeywords(universities, "prefLabel")
			}</TileSearch>

			<TileRange placeholder={"Inception"}>{
				useRange(universities, "inception", { type: year })
			}</TileRange>

			<TileRange placeholder={"Students"}>{
				useRange(universities, "students", { type: integer })
			}</TileRange>

		</>}

		info={<>

			<TileCount>{useStats(universities)}</TileCount>
			<TileClear>{universities}</TileClear>

		</>}

	>

		<TileSheet placeholder={Universities[icon]} sorted={"city.label"} as={({

			id,
			prefLabel,
			comment,
			depiction,

			country

		}) =>

			<TileCard key={id} side={"end"}

				title={<TileLink>{{ id, label: prefLabel }}</TileLink>}
				image={depiction[0]}

				tags={<span>{toEntryString(country)}</span>}

			>{

				toTextString(comment)

			}</TileCard>

		}>{universities}</TileSheet>

	</DataPage>;

}