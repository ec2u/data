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
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, required } from "@metreeca/core";
import { toEntryString } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { integer } from "@metreeca/core/integer";
import { local, toLocalString } from "@metreeca/core/local";
import { year } from "@metreeca/core/year";
import { useCollection } from "@metreeca/data/models/collection";
import { useKeywords } from "@metreeca/data/models/keywords";
import { useRange } from "@metreeca/data/models/range";
import { useStats } from "@metreeca/data/models/stats";
import { icon } from "@metreeca/view";
import { ToolClear } from "@metreeca/view/lenses/clear";
import { ToolCount } from "@metreeca/view/lenses/count";
import { ToolKeywords } from "@metreeca/view/lenses/keywords";
import { ToolRange } from "@metreeca/view/lenses/range";
import { ToolSheet } from "@metreeca/view/lenses/sheet";
import { ToolCard } from "@metreeca/view/widgets/card";
import { Landmark } from "@metreeca/view/widgets/icon";
import { ToolLink } from "@metreeca/view/widgets/link";
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

		label: required(local),
		comment: required(local),
		depiction: required(id),

		country: required({
				id: required(id),
				label: required(local)
			}
		)

	})
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataUniversities() {

	const universities=useCollection(Universities, "members");

	return <DataPage name={Universities} menu={<DataMeta/>}

		tray={<>

			<ToolKeywords placeholder={"Name"}>{
				useKeywords(universities, "label")
			}</ToolKeywords>

			<ToolRange placeholder={"Inception"}>{
				useRange(universities, "inception", { type: year })
			}</ToolRange>

			<ToolRange placeholder={"Students"}>{
				useRange(universities, "students", { type: integer })
			}</ToolRange>

		</>}

		info={<>

			<ToolCount>{useStats(universities)}</ToolCount>
			<ToolClear>{universities}</ToolClear>

		</>}

	>

		<ToolSheet placeholder={Universities[icon]} as={({

			id,
			label,
			comment,
			depiction,

			country

		}) =>

			<ToolCard key={id} side={"end"}

				title={<ToolLink>{{ id, label }}</ToolLink>}
				image={depiction}

				tags={<span>{toEntryString(country)}</span>}

			>{

				toLocalString(comment)

			}</ToolCard>

		}>{universities}</ToolSheet>

	</DataPage>;

}