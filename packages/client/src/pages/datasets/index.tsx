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

import { Dataset } from "@ec2u/data-shared/datasets/index.js";
import { Button } from "@metreeca/tile-cell/button";
import { Fault } from "@metreeca/tile-cell/fault";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { useRoute } from "@metreeca/tile-data/router";
import { useCollection } from "@metreeca/tile-data/store";
import { type ComponentChildren } from "preact";
import { Page } from "../../tiles/page.js";


const Model = {

	id: {},
	label: {}

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const datasets = {

	route: "/",
	label: "European Campus of City-Universities",
	glyph: <Icon.Package/>

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function _Datasets() {

	const route = useRoute();

	const collection = useCollection({
		entry: route,
		shape: Dataset,
		field: "resources",
		model: Model
	});

	return <Page

		head={datasets.label}
		menu={<Button look={"subtle"} icon={<Icon.Help/>} title={"Help"}></Button>}

	>{collection<ComponentChildren>({

		blank: () => null, // !!! placeholder
		ready: ({ state }) => items(state),
		stale: ({ state }) => items(state),
		error: ({ state }) => <Fault {...state}/>

	})}</Page>;


	function items(state: readonly (string | { readonly id: string, readonly label: string })[]) {
		return <ul>{state.filter(item => typeof item !== "string").map(({ id, label }) =>
			<li key={id}><Link href={id}>{label}</Link></li>
		)}</ul>;
	}

}
