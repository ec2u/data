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
import { DataInfo } from "@ec2u/data/pages/datasets/dataset";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
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
import { Files } from "@metreeca/view/widgets/icon";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolSearch } from "@metreeca/view/widgets/search";
import * as React from "react";


export const Documents=immutable({

	[icon]: <Files/>,

	id: required("/documents/"),

	label: required({
		"en": "Documents"
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


export function DataDocuments() {

	const documents=useCollection(Documents, "members");

	return <DataPage name={Documents} menu={<DataInfo/>}

		tray={<>

			<ToolSearch placeholder={"Name"}>{
				useKeywords(documents, "label")
			}</ToolSearch>

			<ToolOptions placeholder={"University"}>{
				useOptions(documents, "university")
			}</ToolOptions>

			<ToolOptions placeholder={"Type"} compact>{
				useOptions(documents, "type", { type: entry({ id: "", label: required(local) }), size: 10 })
			}</ToolOptions>

			<ToolOptions placeholder={"Audience"} compact>{
				useOptions(documents, "audience", { type: entry({ id: "", label: required(local) }), size: 10 })
			}</ToolOptions>

			<ToolOptions placeholder={"Topic"} compact>{
				useOptions(documents, "subject", { type: entry({ id: "", label: required(local) }), size: 10 })
			}</ToolOptions>

			<ToolOptions placeholder={"Language"} compact as={value => toLocalString(Languages[value])}>{
				useOptions(documents, "language", { type: string, size: 10 })
			}</ToolOptions>

			<ToolOptions placeholder={"License"} compact>{
				useOptions(documents, "license", { type: string, size: 10 })
			}</ToolOptions>

		</>}

		info={<>

			<ToolCount>{useStats(documents)}</ToolCount>
			<ToolClear>{documents}</ToolClear>

		</>}

	>

		<ToolSheet placeholder={Documents[icon]} as={({

			id,
			label,
			comment,

			university

		}) =>


			<ToolCard key={id} side={"end"}

				title={<ToolLink>{{ id, label }}</ToolLink>}
				tags={<span>{university && toEntryString(university) || "EC2U Alliance"}</span>}

			>{

				comment && toLocalString(comment)

			}</ToolCard>

		}>{documents}</ToolSheet>

	</DataPage>;

}
