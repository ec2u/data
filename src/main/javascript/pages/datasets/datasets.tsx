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

import { Actors } from "@ec2u/data/pages/actors";
import { Courses } from "@ec2u/data/pages/courses/courses";
import { DataMeta } from "@ec2u/data/pages/datasets/dataset";
import { Documents } from "@ec2u/data/pages/documents/documents";
import { Events } from "@ec2u/data/pages/events/events";
import { Programs } from "@ec2u/data/pages/programs/programs";
import { Units } from "@ec2u/data/pages/units/units";
import { Universities } from "@ec2u/data/pages/universities/universities";
import { ec2u } from "@ec2u/data/views";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, optional, required } from "@metreeca/core";
import { entry } from "@metreeca/core/entry";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { iri } from "@metreeca/core/iri";
import { local, toLocalString } from "@metreeca/core/local";
import { toValueString } from "@metreeca/core/value";
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
import { ReactNode } from "react";


export const Datasets=immutable({

	[icon]: <Package/>,

	id: "/",

	label: {
		"": "European Campus of City-Universities"
	},

	members: [{

		id: required(iri),
		label: required(local),
		comment: optional(local),

		alternative: optional(local),

		entities: required(integer)

	}]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataDatasets() {

	const datasets=useCollection(Datasets, "members", { store: useQuery() });

	return <DataPage name={Datasets} menu={<DataMeta/>}

		tray={< >

			<ToolKeywords placeholder={"Name"}>{
				useKeywords(datasets, "label")
			}</ToolKeywords>

			<ToolOptions placeholder={"License"} as={line => toValueString(line)}>{
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
			label,
			comment,

			alternative,

			entities

		}) =>

			<ToolCard key={id} size={3}

				title={<ToolLink>{{ id, label: ec2u(alternative || label) }}</ToolLink>}

				tags={`${toIntegerString(entities)}`}
				image={<div style={{
					color: "var(--tool--color-light)",
					transform: " translate(10%, -10%)"
				}}>{placeholder(id)}</div>}

			>{

				toLocalString(ec2u(comment || {}))

			}</ToolCard>

		}>{datasets}</ToolSheet>

	</DataPage>;
}


export function placeholder(id: string) {

	const icons: { [id: string]: ReactNode }=[

		Datasets,
		Universities,
		Units,
		Programs,
		Courses,
		Documents,
		Actors,
		Events

	].reduce((icons, dataset) => ({ ...icons, [dataset.id]: (dataset as any)[icon] }), {});

	return icons[id];
}