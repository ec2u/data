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
import { local, toLocalString } from "@metreeca/core/local";
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
import { Package } from "@metreeca/view/widgets/icon";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolSearch } from "@metreeca/view/widgets/search";
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
		label: required(local),
		comment: optional(local),

		university: optional(({
			id: required(id),
			label: required(local)
		}))

	})

});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataResources() {

	const resources=useCollection(Resources, "members");

	return <DataPage name={Resources} menu={<DataInfo/>}

		tray={<>

			<ToolSearch placeholder={"Name"}>{
				useKeywords(resources, "label")
			}</ToolSearch>

			<ToolOptions placeholder={"University"}>{
				useOptions(resources, "university")
			}</ToolOptions>

			<ToolOptions placeholder={"Dataset"} as={({ id, label }) =>
				<ToolLink>{{ id, label: ec2u(label) }}</ToolLink>
			}>{
				useOptions(resources, "dataset", { type: entry })
			}</ToolOptions>

			<ToolOptions placeholder={"Concept"} compact>{
				useOptions(resources, "concept", { type: entry })
			}</ToolOptions>

		</>}

		info={<>

			<ToolCount>{useStats(resources)}</ToolCount>
			<ToolClear>{resources}</ToolClear>

		</>}

	>

		<ToolSheet placeholder={Resources[icon]} sorted={"label"} as={({

			id,
			label,
			comment,

			university

		}) =>

			<ToolCard key={id} side={"end"}

				title={<ToolLink>{{ id, label }}</ToolLink>}
				tags={university && <span>{toEntryString(university)}</span>}

			>{

				comment && toLocalString(comment)

			}</ToolCard>

		}>{resources}</ToolSheet>

	</DataPage>;
}
