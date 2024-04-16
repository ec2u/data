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

import { DataInfo } from "@ec2u/data/pages/datasets/dataset";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { entry } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { integer } from "@metreeca/core/integer";
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
import { GraduationCap } from "@metreeca/view/widgets/icon";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolMark } from "@metreeca/view/widgets/mark";
import * as React from "react";


export const Schemes=immutable({

	[icon]: <GraduationCap/>,

	id: required("/concepts/"),

	label: required({
		"en": "Taxonomies"
	}),

	members: multiple({

		id: required(id),
		label: optional(local),
		comment: optional(local),

		title: required(local),
		alternative: required(local),

		extent: required(integer)

	})

});


export function DataSchemes() {

	const schemes=useCollection(Schemes, "members");


	return <DataPage name={Schemes} menu={<DataInfo/>}

		tray={< >

			<ToolKeywords placeholder={"Name"}>{
				useKeywords(schemes, "label")
			}</ToolKeywords>

			<ToolOptions placeholder={"License"} as={license => toValueString(license)}>{
				useOptions(schemes, "license", { type: entry({ id: "", label: required(local) }) })
			}</ToolOptions>

			<ToolOptions placeholder={"Publisher"} as={license => toValueString(license)}>{
				useOptions(schemes, "publisher", { type: entry({ id: "", label: required(local) }) })
			}</ToolOptions>

			<div className={"info"} style={{

				marginTop: "auto",
				fontSize: "80%"

			}}>This service uses the <a href={"https://esco.ec.europa.eu/en/classification"}>ESCO</a>
				{" "} classification of the European Commission.
			</div>

		</>}

		info={<>

			<ToolCount>{useStats(schemes)}</ToolCount>
			<ToolClear>{schemes}</ToolClear>

		</>}
	>

		<ToolSheet placeholder={Schemes[icon]} as={({

			id,

			title,
			alternative,

			comment,

			extent

		}) =>


			<ToolCard key={id} side={"end"}

				title={<ToolLink>{{

					id,
					label: alternative
						? `${toLocalString(alternative)} / ${toLocalString(title)}`
						: toLocalString(title)

				}}</ToolLink>}

				tags={`${extent} concepts`}

			>{

				comment && <ToolMark>{toLocalString(comment)}</ToolMark>

			}</ToolCard>

		}>{schemes}</ToolSheet>

	</DataPage>;

}

