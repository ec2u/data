/*
 * Copyright © 2020-2023 EC2U Alliance
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

import { DataPage } from "@ec2u/data/views/page";
import { immutable } from "@metreeca/core";
import { integer } from "@metreeca/core/integer";
import { toLocalString } from "@metreeca/core/local";
import { title } from "@metreeca/data/contexts/router";
import { useCollection } from "@metreeca/data/models/collection";
import { useKeywords } from "@metreeca/data/models/keywords";
import { useQuery } from "@metreeca/data/models/query";
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
import { useEffect } from "react";


export const Universities=immutable({

	[icon]: <Landmark/>,

	id: "/universities/",

	label: {
		"en": "Universities"
	},

	members: [{

		id: "",
		image: "",

		label: {},
		comment: {},

		country: {
			id: "",
			label: {}
		}

	}]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataUniversities() {

	const universities=useCollection(Universities, "members", { store: useQuery() });

	useEffect(() => { title(Universities); }, []);


	return <DataPage name={Universities}

		tray={< >

			<ToolKeywords placeholder={"Name"}>{
				useKeywords(universities, "label")
			}</ToolKeywords>

			{/*<ToolRange placeholder={"Inception"}>{
			 useRange(universities, "inception")
			 }</ToolRange>*/}

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
			image,

			country

		}) =>

			<ToolCard key={id} side={"end"}

				title={<ToolLink>{{ id, label }}</ToolLink>}
				image={image}

				tags={<span>{toLocalString(country.label)}</span>}

			>
				{toLocalString(comment)}

			</ToolCard>

		}>{universities}</ToolSheet>

	</DataPage>;

}