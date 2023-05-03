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

import { ec2u } from "@ec2u/data/views";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, optional, required } from "@metreeca/core";
import { entry } from "@metreeca/core/entry";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { toLocalString } from "@metreeca/core/local";
import { toValueString } from "@metreeca/core/value";
import { title } from "@metreeca/data/contexts/router";
import { useCollection } from "@metreeca/data/models/collection";
import { useKeywords } from "@metreeca/data/models/keywords";
import { useOptions } from "@metreeca/data/models/options";
import { useQuery } from "@metreeca/data/models/query";
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
import { useEffect } from "react";


export const Datasets=immutable({

	[icon]: <Package/>,

	id: "/",

	label: {
		"en": "Datasets"
	},

	members: [{

		id: "",
		label: { en: "" },
		comment: optional({ en: "" }),

		alternative: optional({ en: "" }),
		description: optional({ en: "" }),

		entities: required(integer)

	}]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataDatasets() {

	const datasets=useCollection(Datasets, "members", { store: useQuery() });


	useEffect(() => { title(Datasets); }, []);


	return (

		<DataPage name={Datasets}

			// menu={<DataMeta>{route}</DataMeta>}

			tray={< >

				<ToolKeywords placeholder={"Name"}>{
					useKeywords(datasets, "label")
				}</ToolKeywords>

				<ToolOptions placeholder={"License"} as={line => toValueString(line)}>{
					useOptions(datasets, "license", { type: entry })
				}</ToolOptions>

			</>}

			info={<>

				<ToolCount>{useStats(datasets)}</ToolCount>
				<ToolClear>{datasets}</ToolClear>

			</>}

		>

			<ToolSheet placeholder={Datasets[icon]} sorted={{ entities: "increasing" }} as={({

				id,
				label,
				comment,

				alternative,

				entities

			}) =>

				<ToolCard key={id} side={"end"}

					title={<ToolLink>{{ id, label: ec2u(label) }}</ToolLink>}

					tags={`${toIntegerString(entities)} entities`}

				>{

					toLocalString(ec2u(alternative || comment || {}))

				}</ToolCard>

			}>{datasets}</ToolSheet>

		</DataPage>

	);
}
