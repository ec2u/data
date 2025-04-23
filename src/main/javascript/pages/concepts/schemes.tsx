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
import { immutable, multiple, optional, required, virtual } from "@metreeca/core";
import { entry } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { integer } from "@metreeca/core/integer";
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
import { GraduationCap } from "@metreeca/view/widgets/icon";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileMark } from "@metreeca/view/widgets/mark";
import { TileSearch } from "@metreeca/view/widgets/search";
import * as React from "react";


export const Schemes=immutable({

	[icon]: <GraduationCap/>,

	id: required("/concepts/"),

	label: required({
		"en": "Taxonomies"
	}),

	members: multiple({

		id: required(id),
		label: required(text),
		comment: optional(text),

		title: required(text),
		alternative: required(text),

		hasConcept: [{

			count: virtual(required(integer)),
			"count=count:": required(integer)

		}]

	})

});


export function DataSchemes() {

	const schemes=useCollection(Schemes, "members");


	return <DataPage name={Schemes} menu={<DataInfo/>}

		tray={< >

			<TileSearch placeholder={"Name"}>{
				useKeywords(schemes, "label")
			}</TileSearch>

			<TileOptions placeholder={"License"} as={license => toValueString(license)}>{
				useOptions(schemes, "license", { type: entry({ id: "", label: required(text) }) })
			}</TileOptions>

			<TileOptions placeholder={"Publisher"} as={license => toValueString(license)}>{
				useOptions(schemes, "publisher", { type: entry({ id: "", label: required(text) }) })
			}</TileOptions>

			<div className={"info"} style={{

				marginTop: "auto",
				fontSize: "90%"

			}}>This service uses the <a href={"https://esco.ec.europa.eu/en/classification"}>ESCO</a>
				{" "} classification of the European Commission.
			</div>

		</>}

		info={<>

			<TileCount>{useStats(schemes)}</TileCount>
			<TileClear>{schemes}</TileClear>

		</>}
	>

		<TileSheet placeholder={Schemes[icon]} as={({

			id,

			title,
			alternative,

			comment,

			hasConcept

		}) =>


			<TileCard key={id} side={"end"}

				title={<TileLink>{{

					id,
					label: alternative
						? `${toTextString(alternative)} / ${toTextString(title)}`
						: toTextString(title)

				}}</TileLink>}

				tags={`${hasConcept[0].count} concepts`}

			>{

				comment && <TileMark>{toTextString(comment)}</TileMark>

			}</TileCard>

		}>{schemes}</TileSheet>

	</DataPage>;

}

