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
import { immutable, multiple, optional, required, virtual } from "@metreeca/core";
import { entry } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { text, toTextString } from "@metreeca/core/text";
import { toValueString } from "@metreeca/core/value";
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


export const Datasets=immutable({

	[icon]: <Package/>,

	id: required("/"),

	label: required({
		"": "European Campus of City-Universities"
	}),

	isDefinedBy: optional(id),

	members: multiple({

		id: required(id),
		comment: optional(text),

		title: required(text),
		alternative: optional(text),

		members: [{

			count: virtual(required(integer)),
			"count=count:": required(integer)

		}]
	})

});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataDatasets() {

	const datasets=useCollection(Datasets, "members");

	return <DataPage name={Datasets} menu={<DataInfo/>}

		tray={< >

			<TileSearch placeholder={"Name"}>{
				useKeywords(datasets, "label")
			}</TileSearch>

			<TileOptions placeholder={"License"} as={license => toValueString(license)}>{
				useOptions(datasets, "license", { type: entry({ id: "", label: required(text) }) })
			}</TileOptions>

		</>}

		info={<>

			<TileCount>{useStats(datasets)}</TileCount>
			<TileClear>{datasets}</TileClear>

		</>}

	>

		<TileSheet placeholder={Datasets[icon]} sorted={(x, y) => x.members[0].count - y.members[0].count} as={({

			id,

			title,
			alternative,
			comment,

			members

		}) => <>

			<TileCard key={id} size={7.5}

				title={<TileLink>{{ id, label: ec2u(title) }}</TileLink>}

				tags={toIntegerString(members[0].count)}
				image={alternative && <span>{ec2u(toTextString(alternative))}</span>}

			>{

				comment && toTextString(ec2u(comment))

			}</TileCard></>

		}>{datasets}</TileSheet>


	</DataPage>;
}
