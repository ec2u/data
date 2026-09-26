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
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Fault } from "@metreeca/tile-cell/fault";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useCollection } from "@metreeca/tile-data/store";
import { useEffect } from "preact/hooks";
import { Page } from "../../tiles/page.js";


export const datasets = immutable({

	route: "/",
	label: "European Campus of City-Universities",
	glyph: <Icon.Package/>,

	model: {
		id: {},
		label: {}
	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DatasetsPage() {

	const route = useRoute();
	const router = useRouter();

	const collection = useCollection({
		entry: route,
		shape: Dataset,
		field: "resources",
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
		error: ({ state }) => <Fault {...state}/>,

		ready: ({ state }) => <ul>{state.map(({ id, label }) =>
			<li key={id}><Link href={id}>{label}</Link></li>
		)}</ul>

	})}</Page>;


}
