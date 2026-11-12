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
import { Stack } from "@metreeca/clay-widgets/stack";
import { TOC } from "@metreeca/clay-widgets/toc";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { isNumber, isObject, isOptional, isString, opt } from "@metreeca/core";
import { internalize } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import { useCollection } from "@metreeca/tile/collection";
import { useMembers } from "@metreeca/tile/members";
import { useQuery } from "@metreeca/tile/query";
import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import { byDataset, ec2u, PublicDatasets } from "../index.core.js";
import { Failure } from "../widgets/failure.js";
import { Funded } from "../widgets/home/funded.js";
import { Brand } from "../widgets/home/brand.js";
import { Page } from "../widgets/page.js";
import { Print } from "../widgets/home/print.js";
import { courses } from "./courses/index.js";
import { DatasetLinks } from "../widgets/datasets/dataset.js";
import { type Dataset, Datasets as DatasetList } from "../widgets/home/datasets.js";
import { documents } from "./documents/index.js";
import { events } from "./events/index.js";
import { programs } from "./programs/index.js";
import { units } from "./units/index.js";
import { universities } from "./universities/index.js";


export const datasets = immutable({

	route: "/",
	label: "The European Campus of City-Universities",
	glyph: <Icon.Package/>

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const resources = immutable({

	"Get Involved": {
		"Publishers": "/about/publishers/",
		"Webmasters": "/about/webmasters/",
		"Developers": "/about/developers/"
	},

	"References": {
		"About the Hub": "/about/",
		"APIs & Models": "/about/models/",
		"Taxonomies": "/taxonomies/",
		"Open Source": "https://github.com/ec2u/data"
	}

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

		head={<>
			<Brand/>
			{datasets.label}
		</>}

		menu={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLinks/>)}

		tray={<Stack space={"spacing075"}>

			<p style={{

				maxWidth: "15em"

			}}>

				Open data on the universities of{"\u00A0"}the <Link href={"https://www.ec2u.eu/"}>EC2U</Link> European
				University alliance and their local partners, harmonised and cross-linked for{"\u00A0"}search and reuse.

			</p>

			<TOC name={"Resources"} entries={resources}/>

		</Stack>}

		more={<Print>

			<Link look={"subtle"} href={"/about/legal/ai"}>AI Content</Link><br/>
			<Link look={"subtle"} href={"/about/legal/accessibility"}>Accessibility</Link><br/>
			<Link look={"subtle"} href={"/about/legal/"}>Legal</Link>
			{" & "}
			<Link look={"subtle"} href={"/about/legal/privacy"}>Privacy</Link>

		</Print>}

	><Funded>{members({

		blank: () => <Empty look={"subtle"}>{datasets.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{datasets.glyph}</Empty></Failure>,

		ready: ({ state }) => {

			const rows = state.filter(isDatasetRow).sort(byDataset);

			return rows.length === 0 ? <Empty>{datasets.glyph}</Empty> : <DatasetList datasets={rows.map(dataset)}/>;

		}

	})}</Funded></Page>;

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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the grid cell listing a dataset on the home page.
 *
 * Sets the dataset beside the glyph of its catalogue page, standing out more or less according to how central the
 * dataset is to the alliance: universities first, then units, programs and courses, then everything else; an unknown
 * dataset is listed without a glyph, at the lowest priority.
 */
function dataset({ dataset: { id, title, description }, size }: DatasetRow): Dataset {

	const route = internalize(location.href, id);

	const [glyph, priority]: readonly [ComponentChildren, Dataset["priority"]]
		= route === universities.route ? [universities.glyph, 3]
		: route === units.route ? [units.glyph, 2]
			: route === programs.route ? [programs.glyph, 2]
				: route === courses.route ? [courses.glyph, 2]
					: route === documents.route ? [documents.glyph, 1]
						: route === events.route ? [events.glyph, 1]
							: [undefined, 1];

	return {
		href: id,
		name: ec2u(title),
		size,
		glyph,
		priority,
		description: opt(description, ec2u)
	};

}
