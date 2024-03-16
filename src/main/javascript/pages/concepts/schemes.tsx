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
import { immutable, multiple, optional, required } from "@metreeca/core";
import { integer } from "@metreeca/core/integer";
import { local, toLocalString } from "@metreeca/core/local";
import { reference } from "@metreeca/core/reference";
import { useCollection } from "@metreeca/data/models/collection";
import { useKeywords } from "@metreeca/data/models/keywords";
import { useQuery } from "@metreeca/data/models/query";
import { useStats } from "@metreeca/data/models/stats";
import { icon } from "@metreeca/view";
import { ToolClear } from "@metreeca/view/lenses/clear";
import { ToolCount } from "@metreeca/view/lenses/count";
import { ToolKeywords } from "@metreeca/view/lenses/keywords";
import { ToolSheet } from "@metreeca/view/lenses/sheet";
import { ToolCard } from "@metreeca/view/widgets/card";
import { GraduationCap } from "@metreeca/view/widgets/icon";
import { ToolLink } from "@metreeca/view/widgets/link";
import * as React from "react";


export const Schemes=immutable({

	[icon]: <GraduationCap/>,

	id: required(reference),
	label: required({
		"en": "Taxonomies"
	}),

	members: multiple({

		id: required(reference),
		label: required(local),
		comment: optional(local),

		extent: required(integer)

	})

});


export function DataSchemes() {

	const schemes=useCollection(Schemes, "members", { store: useQuery() });


	return <DataPage name={Schemes} menu={<DataMeta/>}

		tray={< >

			<ToolKeywords placeholder={"Name"}>{
				useKeywords(schemes, "label")
			}</ToolKeywords>

		</>}

		info={<>

			<ToolCount>{useStats(schemes)}</ToolCount>
			<ToolClear>{schemes}</ToolClear>

		</>}
	>

		<ToolSheet placeholder={Schemes[icon]} as={({

			id,

			label,
			comment,

			extent

		}) =>


			<ToolCard key={id} side={"end"}

				title={<ToolLink>{{ id, label }}</ToolLink>}

				tags={`${extent} concepts`}

			>{

				comment && toLocalString(comment)

			}</ToolCard>

		}>{schemes}</ToolSheet>

	</DataPage>;

}

