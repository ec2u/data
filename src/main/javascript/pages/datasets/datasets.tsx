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

import { DataMeta } from "@ec2u/data/pages/datasets/dataset";
import { ec2u } from "@ec2u/data/views";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { entry } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { local, toLocalString } from "@metreeca/core/local";
import { toValueString } from "@metreeca/core/value";
import { useCollection } from "@metreeca/data/models/collection";
import { useKeywords } from "@metreeca/data/models/keywords";
import { useOptions } from "@metreeca/data/models/options";
import { useStats } from "@metreeca/data/models/stats";
import { icon } from "@metreeca/view";
import { ToolClear } from "@metreeca/view/lenses/clear";
import { ToolCount } from "@metreeca/view/lenses/count";
import { ToolKeywords } from "@metreeca/view/lenses/keywords";
import { ToolOptions } from "@metreeca/view/lenses/options";
import { ToolSheet } from "@metreeca/view/lenses/sheet";
import { ToolCard } from "@metreeca/view/widgets/card";
import { Package } from "@metreeca/view/widgets/icon";
import { ToolLink } from "@metreeca/view/widgets/link";
import * as React from "react";


export const Datasets=immutable({

	[icon]: <Package/>,

	id: required("/"),

	label: required({
		"": "European Campus of City-Universities"
	}),

	members: multiple({

		id: required(id),
		label: required(local),
		comment: optional(local),

		title: required(local),
		alternative: optional(local),

		entities: required(integer)

	})

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataDatasets() {

	const datasets=useCollection(Datasets, "members");

	return <DataPage name={Datasets} menu={<DataMeta/>}

		tray={< >

			<ToolKeywords placeholder={"Name"}>{
				useKeywords(datasets, "label")
			}</ToolKeywords>

			<ToolOptions placeholder={"License"} as={license => toValueString(license)}>{
				useOptions(datasets, "license", { type: entry({ id: "", label: required(local) }) })
			}</ToolOptions>

		</>}

		info={<>

			<ToolCount>{useStats(datasets)}</ToolCount>
			<ToolClear>{datasets}</ToolClear>

		</>}

	>

		<ToolSheet placeholder={Datasets[icon]} sorted={"entities"} as={({

			id,

			title,
			alternative,
			comment,

			entities

		}) =>

			<ToolCard key={id} size={7.5}

				title={<ToolLink>{{ id, label: ec2u(title) }}</ToolLink>}

				tags={`${toIntegerString(entities)}`}
				image={alternative && <span>{ec2u(toLocalString(alternative))}</span>}

			>{

				comment && toLocalString(ec2u(comment))

			}</ToolCard>

		}>{datasets}</ToolSheet>

	</DataPage>;
}
