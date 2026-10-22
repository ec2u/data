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
import { isNumber, isString } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useCollection } from "@metreeca/tile-data/store";
import { useEffect } from "preact/hooks";
import { ec2u } from "../../_/ec2u.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";


export const datasets = immutable({

	route: "/",
	label: "European Campus of City-Universities",
	glyph: <Icon.Package/>,

	model: {

		resources: {
			id: {},
			title: {},
			alternative: {},
			description: {}
		}

	},

	// projection bindings can't be mixed with template fields: member counts are retrieved separately

	counts: {

		resources: {
			"id=": {},
			"count=count:resources": {}
		}

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DatasetsPage() {

	const route = useRoute();
	const router = useRouter();

	const collection = useCollection({
		entry: route,
		shape: Datasets,
		model: datasets.model
	});

	const counts = useCollection({
		entry: route,
		shape: Datasets,
		model: datasets.counts
	});

	const tally: Readonly<Record<string, number>> = counts({

		ready: ({ state }) => Object.fromEntries(state.flatMap(({ id, count }) =>
			isString(id) && isNumber(count) ? [[id, count]] : []
		))

	}, {});

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

		ready: ({ state }) => <ul>{state.map(({ id, title }) =>
			<li key={id}><Link href={id}>{ec2u(title)}</Link> {tally[id]}</li>
		)}</ul>

	})}</Page>;


}
