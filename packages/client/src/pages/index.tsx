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

import { Datasets as DatasetsShape } from "@ec2u/data-shared";
import { Button } from "@metreeca/clay-widgets/button";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Link } from "@metreeca/clay-widgets/link";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { isNumber, isObject, isOptional, isString, opt } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { Clear } from "@metreeca/tile-widgets/filters/clear";
import { Search } from "@metreeca/tile-widgets/filters/search";
import { Tally } from "@metreeca/tile-widgets/filters/tally";
import { Count } from "@metreeca/tile-widgets/viewers/count";
import { useCollection } from "@metreeca/tile/collection";
import { useCount } from "@metreeca/tile/count";
import { useMembers } from "@metreeca/tile/members";
import { useQuery } from "@metreeca/tile/query";
import { useSearch } from "@metreeca/tile/search";
import { useTally } from "@metreeca/tile/tally";
import { integer } from "@metreeca/tile/types/integer";
import { createElement, Fragment } from "preact";
import { useEffect } from "preact/hooks";
import { byDataset, ec2u, PublicDatasets, TallyOptions } from "../index.core.js";
import { Failure } from "../tiles/failure.js";
import { Page } from "../tiles/page.js";
import { DatasetLinks } from "./datasets/dataset.js";
import "./index.css";


export const datasets = immutable({

	route: "/",
	label: "The European Campus of City-Universities",
	glyph: <Icon.Package/>

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Datasets() {

	const route = useRoute();
	const router = useRouter();

	const [query, setQuery] = useQuery();

	const collection = useCollection({

		entry: route,
		shape: DatasetsShape,
		field: "resources",

		scope: { "?": PublicDatasets },
		query,

		onChange: setQuery

	});

	const search = useSearch(collection, "label");
	const license = useTally(collection, "license", { label: "label", size: TallyOptions });
	const count = useCount(collection);

	const members = useMembers(collection, {

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


	useEffect(() => router({ title: "" }), []);


	return <Page

		head={datasets.label}
		menu={<DatasetLinks/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Search name={"Name"} search={search}/>

			<Tally name={"License"} collapsed tally={license}/>

		</>}

		info={<>
			<Count collection={collection} count={count}/>
			<Clear collection={collection}/>
		</>}

	>{members({

		blank: () => <Empty>{datasets.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{datasets.glyph}</Empty></Failure>,

		ready: ({ state }) => {

			const rows = state.filter(isDatasetRow).sort(byDataset);

			return rows.length === 0 ? <Empty>{datasets.glyph}</Empty> : createElement("datasets-grid", {}, rows.map(({
				dataset: { id, title, alternative, description },
				size
			}) => <Fragment key={id}>

				<span class="size">{integer.format(size)}</span>
				<span class="title"><Link href={id}>{ec2u(title)}</Link></span>

				<span class="alternative">{opt(alternative, ec2u)}</span>
				<span class="description">{opt(description, ec2u)}</span>

			</Fragment>));

		}

	})}</Page>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * A dataset published on the hub, with the number of resources it holds.
 */
export type DatasetRow = {

	readonly dataset: {
		readonly id: string
		readonly title: string
		readonly alternative?: string
		readonly description?: string
	}

	readonly size: number

};


/**
 * Checks if a projected row describes a dataset.
 *
 * Rows projected through aliased or computed bindings come back from the store untyped, so rows lacking a dataset cell
 * or a size are told apart here and left out of the dataset listing on the home page of the knowledge hub.
 *
 * @param value The row to be checked
 *
 * @returns `true` if `value` holds a dataset and its size; `false` otherwise
 */
export function isDatasetRow(value: unknown): value is DatasetRow {
	return isObject(value, {

		dataset: dataset => isObject(dataset, {
			id: isString,
			title: isString,
			alternative: alternative => isOptional(alternative, isString),
			description: description => isOptional(description, isString)
		}),

		size: isNumber

	});
}
