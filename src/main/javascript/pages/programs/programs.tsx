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
import { entry, toEntryString } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { local, toLocalString } from "@metreeca/core/local";
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
import { GraduationCap } from "@metreeca/view/widgets/icon";
import { ToolLink } from "@metreeca/view/widgets/link";
import * as React from "react";


export const Programs=immutable({

	[icon]: <GraduationCap/>,

	id: required("/programs/"),

	label: required({
		"en": "Programs"
	}),

	members: multiple({

		id: required(id),
		label: required(local),
		comment: optional(local),

		university: {
			id: required(id),
			label: required(local)
		}

	})

});


export function DataPrograms() {

	const programs=useCollection(Programs, "members", { store: useQuery() });


	return <DataPage name={Programs} menu={<DataMeta/>}

		tray={< >

			<ToolKeywords placeholder={"Name"}>{
				useKeywords(programs, "label")
			}</ToolKeywords>


			<ToolOptions placeholder={"University"}>{
				useOptions(programs, "university", { type: entry({ id: "", label: required(local) }) })
			}</ToolOptions>

		</>}

		/* 

		 <NodeOptions path={"provider"} type={"anyURI"} placeholder={"Provider"} state={[query, setQuery]}/>
		 <NodeOptions path={"educationalLevel"} type={"anyURI"} placeholder={"Level"} state={[query, setQuery]}/>
		 <NodeOptions path={"timeToComplete"} type={"string"} placeholder={"Time to Complete"} state={[query,
		 setQuery]}/> <NodeRange path={"numberOfCredits"} type={"decimal"} placeholder={"Credits"} state={[query,
		 setQuery]}/> {/!*<NodeOptions path={"educationalCredentialAwarded"} type={"anyURI"} placeholder={"Title Awarded"}
		 state={[query, setQuery]}/>*!/}

		 */

		info={<>

			<ToolCount>{useStats(programs)}</ToolCount>
			<ToolClear>{programs}</ToolClear>

		</>}

	>

		<ToolSheet placeholder={Programs[icon]} as={({

			id,
			label,
			comment,

			university

		}) =>

			<ToolCard key={id} side={"end"}

				title={<ToolLink>{{ id, label }}</ToolLink>}
				tags={toEntryString(university)}

			>{

				comment && toLocalString(comment)

			}</ToolCard>

		}>{programs}</ToolSheet>;

	</DataPage>;
}

