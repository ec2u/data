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
import { isNumber, isObject, isString } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useCollection } from "@metreeca/tile-data/store";
import { useEffect } from "preact/hooks";
import { ec2u } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";


export const datasets = immutable({

	route: "/",
	label: "European Campus of City-Universities",
	glyph: <Icon.Package/>,

	model: {

		resources: {

			"dataset=": {
				id: {},
				title: {},
				alternative: {},
				description: {}
			},

			"size=count:resources": {}

		}

	}

});


/**
 * Dataset paths in display order; datasets not listed follow in store order.
 */
const order = [
	"/universities/",
	"/units/",
	"/programs/",
	"/courses/",
	"/documents/",
	"/events/"
];

function rank(id: string): number {

	const index = order.indexOf(new URL(id, location.href).pathname);

	return index < 0 ? order.length : index;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DatasetsPage() {

	const route = useRoute();
	const router = useRouter();

	const collection = useCollection({
		entry: route,
		shape: Datasets,
		model: datasets.model
	});

	useEffect(() => router({ title: "" }), []);


	return <Page

		head={datasets.label}
		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={collection({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

	>{collection({

		blank: () => <Hint>{datasets.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{datasets.glyph}</Hint></Failure>,

		// !!! projected rows are untyped: skip rows lacking a dataset cell until a typed DSL (metreeca/keep#15)

		ready: ({ state }) => <ul>{state

			.flatMap(({ dataset, size }) => isObject(dataset) && isString(dataset.id) && isString(dataset.title)
				? [{
					id: dataset.id,
					title: dataset.title,
					alternative: dataset.alternative,
					description: dataset.description,
					size
				}]
				: []
			)

			.sort((x, y) => rank(x.id)-rank(y.id)) // fresh array from flatMap

			.map(({ id, title, alternative, description, size }) => <li key={id}>
				{isString(alternative) && <strong>{ec2u(alternative)}</strong>} {isNumber(size) && size}
				<br/>
				<Link href={id}>{ec2u(title)}</Link>
				{isString(description) && <p>{ec2u(description)}</p>}
			</li>)

		}</ul>

	})}</Page>;


}
