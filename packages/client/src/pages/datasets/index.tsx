/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { Datasets } from "@ec2u/data-shared/datasets/index.js";
import { opt } from "@metreeca/core";
import { by } from "@metreeca/core/order";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useCollection, useMembers } from "@metreeca/tile-data/store";
import { createElement, Fragment } from "preact";
import { useEffect } from "preact/hooks";
import { ec2u } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { courses } from "../courses/courses.js";
import { documents } from "../documents/documents.js";
import { events } from "../events/events.js";
import { programs } from "../programs/programs.js";
import { units } from "../units/units.js";
import { universities } from "../universities/universities.js";
import { type DatasetRow, isDatasetRow } from "./index.core.js";
import "./index.css";


/**
 * Dataset paths in display order; datasets not listed follow in store order.
 */
const order = [
	universities.route,
	units.route,
	programs.route,
	courses.route,
	documents.route,
	events.route
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const datasets = immutable({

	route: "/",
	label: "European Campus of City-Universities",
	glyph: <Icon.Package/>,

	model: {

		"dataset=": {
			id: {},
			title: {},
			alternative: {},
			description: {}
		},

		"size=count:resources": {}

	}

});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DatasetsPage() {

	const route = useRoute();
	const router = useRouter();

	const collection = useCollection({
		entry: route,
		shape: Datasets,
		field: "resources"
	});

	const members = useMembers(collection, { model: datasets.model });

	useEffect(() => router({ title: "" }), []);


	return <Page

		head={datasets.label}
		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

	>{members({

		blank: () => <Hint>{datasets.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{datasets.glyph}</Hint></Failure>,

		ready: ({ state }) => grid(state.filter(isDatasetRow))

	})}</Page>;


}


/**
 * Renders the datasets published on the hub.
 *
 * @param rows The datasets to be rendered, with their size
 *
 * @returns A grid row for each dataset, in display order, or the collection glyph if `rows` is empty
 */
function grid(rows: readonly DatasetRow[]) {
	return rows.length === 0 ? <Hint>{datasets.glyph}</Hint> : createElement("datasets-grid", {}, [...rows] // copy, as rows are shared

		.sort(by(({ dataset }) => new URL(dataset.id).pathname, by(path =>
			order.includes(path) ? order.indexOf(path) : order.length
		)))

		.map(({ dataset: { id, title, alternative, description }, size }) => <Fragment key={id}>

			<span class="size">{size.toLocaleString()}</span>
			<span class="title"><Link href={id}>{ec2u(title)}</Link></span>

			<span class="alternative">{opt(alternative, ec2u)}</span>
			<span class="description">{opt(description, ec2u)}</span>

		</Fragment>)

	);
}
