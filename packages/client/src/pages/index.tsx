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

import { Datasets as DatasetsShape } from "@ec2u/data-shared/datasets/index.js";
import { isNumber, isObject, isOptional, isString, opt } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useCollection, useCount, useKeywords, useMembers, useQuery, useTally } from "@metreeca/tile-data/store";
import { Clear } from "@metreeca/tile-lens/clear";
import { Count } from "@metreeca/tile-lens/count";
import { Tally } from "@metreeca/tile-lens/tally";
import { integer } from "@metreeca/tile-type/integer";
import { createElement, Fragment } from "preact";
import { useEffect } from "preact/hooks";
import { Search } from "../_/search.js";
import { byDataset, ec2u, PublicDatasets, TallyOptions } from "../index.core.js";
import { Failure } from "../tiles/failure.js";
import { Page } from "../tiles/page.js";
import { DatasetLink } from "./datasets/dataset.js";
import "./index.css";


export const datasets = immutable({

	route: "/",
	label: "European Campus of City-Universities",
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

	const keywords = useKeywords(collection, "label");
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
		menu={<DatasetLink href={datasets.route}/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Search placeholder={"Name"} value={keywords.text} onChange={keywords.search}/>

			<Tally name={"License"} compact tally={license}/>

		</>}

		info={<>
			<Count collection={collection} count={count}/>
			<Clear collection={collection}/>
		</>}

	>{members({

		blank: () => <Hint>{datasets.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{datasets.glyph}</Hint></Failure>,

		ready: ({ state }) => {

			const rows = state.filter(isDatasetRow).sort(byDataset);

			return rows.length === 0 ? <Hint>{datasets.glyph}</Hint> : createElement("datasets-grid", {}, rows.map(({
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
