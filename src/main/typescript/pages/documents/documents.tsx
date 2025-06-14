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

import { Languages } from "@ec2u/data/languages";

import { DataInfo } from "@ec2u/data/views/info";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { entry, toEntryString } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { string } from "@metreeca/core/string";
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
import { Files } from "@metreeca/view/widgets/icon";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileSearch } from "@metreeca/view/widgets/search";
import * as React from "react";


export const Documents=immutable({

	[icon]: <Files/>,

	id: required("/documents/"),

	label: required({
		"en": "Documents"
	}),

	members: multiple({

		id: required(id),
		label: required(text),
		comment: optional(text),

		university: optional({
				id: required(id),
			label: required(text)
			}
		)

	})

});


export function DataDocuments() {

	const documents=useCollection(Documents, "members");

	return <DataPage name={Documents} menu={<DataInfo/>}

		tray={<>

			<TileSearch placeholder={"Name"}>{
				useKeywords(documents, "label")
			}</TileSearch>

			<TileOptions placeholder={"University"}>{
				useOptions(documents, "university")
			}</TileOptions>

			<TileOptions placeholder={"Type"} compact>{
				useOptions(documents, "type", { type: entry({ id: "", label: required(text) }), size: 10 })
			}</TileOptions>

			<TileOptions placeholder={"Audience"} compact>{
				useOptions(documents, "audience", { type: entry({ id: "", label: required(text) }), size: 10 })
			}</TileOptions>

			<TileOptions placeholder={"Topic"} compact>{
				useOptions(documents, "subject", { type: entry({ id: "", label: required(text) }), size: 10 })
			}</TileOptions>

			<TileOptions placeholder={"Language"} compact as={value => toTextString(Languages[value])}>{
				useOptions(documents, "language", { type: string, size: 10 })
			}</TileOptions>

			<TileOptions placeholder={"License"} compact>{
				useOptions(documents, "license", { type: string, size: 10 })
			}</TileOptions>

		</>}

		info={<>

			<TileCount>{useStats(documents)}</TileCount>
			<TileClear>{documents}</TileClear>

		</>}

	>

		<TileSheet placeholder={Documents[icon]} as={({

			id,
			label,
			comment,

			university

		}) =>


			<TileCard key={id} side={"end"}

				title={<TileLink>{{ id, label }}</TileLink>}
				tags={<span>{university && toEntryString(university) || "EC2U Alliance"}</span>}

			>{

				comment && toTextString(comment)

			}</TileCard>

		}>{documents}</TileSheet>

	</DataPage>;

}
