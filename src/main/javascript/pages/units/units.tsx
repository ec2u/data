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
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { entry } from "@metreeca/core/entry";
import { toFrameString } from "@metreeca/core/frame";
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
import { FlaskConical } from "@metreeca/view/widgets/icon";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolSearch } from "@metreeca/view/widgets/search";
import * as React from "react";


export const Units=immutable({

	[icon]: <FlaskConical/>,

	id: required("/units/"),

	label: required({
		"en": "Units"
	}),

	members: multiple({

		id: required(id),
		label: required(local),
		comment: optional(local),

		university: optional({
			label: required(local)
		})

	})

});


export function DataUnits() {

	const units=useCollection(Units, "members");


	return <DataPage name={Units} menu={<DataInfo/>}

		tray={<>

			<ToolSearch placeholder={"Name"}>{
				useKeywords(units, "label")
			}</ToolSearch>

			<ToolOptions placeholder={"University"}>{
				useOptions(units, "university", { type: entry({ id: "", label: required(local) }) })
			}</ToolOptions>

			<ToolOptions placeholder={"Type"} compact>{
				useOptions(units, "classification", { type: entry({ id: "", label: required(local) }), size: 10 })
			}</ToolOptions>

			<ToolOptions placeholder={"Topic"} compact>{
				useOptions(units, "subject", { type: entry({ id: "", label: required(local) }), size: 10 })
			}</ToolOptions>

		</>}

		info={<>

			<ToolCount>{useStats(units)}</ToolCount>
			<ToolClear>{units}</ToolClear>

		</>}
	>

		<ToolSheet placeholder={Units[icon]} as={({

			id,
			comment,
			label,

			university

		}) =>

			<ToolCard key={id} side={"end"}

				title={<ToolLink>{{ id, label }}</ToolLink>}

				tags={university && <div>{toFrameString(university) || "EC2U Alliance"}</div>}

			>{

				comment && toLocalString(comment)

			}</ToolCard>

		}>{units}</ToolSheet>

	</DataPage>;

}
