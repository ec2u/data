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

import { Taxonomies } from "@ec2u/data-shared/taxonomies/index.js";
import { by, locale } from "@metreeca/core/order";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useCollection, useCount, useKeywords, useMembers, useQuery, useTally } from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { Clear } from "@metreeca/tile-lens/clear";
import { Count } from "@metreeca/tile-lens/count";
import { Tally } from "@metreeca/tile-lens/tally";
import { integer } from "@metreeca/tile-type/integer";
import { useEffect } from "preact/hooks";
import { FacetSize } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { Search } from "../../tiles/search.js";
import { DatasetLink, DatasetPage } from "../datasets/dataset.js";
import { isTaxonomyRow, type TaxonomyRow } from "./taxonomies.core.js";


export const taxonomies = immutable({

	route: "/taxonomies/",
	label: "Taxonomies",
	glyph: <Icon.Tags/>

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function TaxonomiesInfo() {

	return <DatasetPage href={taxonomies.route} label={taxonomies.label} glyph={taxonomies.glyph}/>;

}

export function TaxonomiesData() {

	const route = useRoute();
	const router = useRouter();

	const [query, setQuery] = useQuery();

	const collection = useCollection({
		entry: route,
		shape: Taxonomies,
		field: "resources",
		criteria: query,
		onChange: setQuery
	});


	const keywords = useKeywords(collection, "label", { delay: 0 }); // the search field times the pause itself
	const license = useTally(collection, "license", { label: "label", size: FacetSize });
	const publisher = useTally(collection, "publisher", { label: "label", size: FacetSize });
	const count = useCount(collection);

	const members = useMembers(collection, {
		model: {
			"taxonomy=": { id: {}, label: {}, title: {}, alternative: {}, description: {} },
			"size=count:resources": {}
		}
	});

	useEffect(() => router({ title: taxonomies.label }), []);


	return <Page

		head={taxonomies.label}
		menu={<DatasetLink href={taxonomies.route}/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Search placeholder={"Name"} value={keywords.text} onChange={keywords.search}/>

			<Tally name={"License"} compact tally={license}/>
			<Tally name={"Publisher"} compact tally={publisher}/>

		</>}

		info={<>
			<Count collection={collection} count={count}/>
			<Clear collection={collection}/>
		</>}

	>{members({

		blank: () => <Hint>{taxonomies.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{taxonomies.glyph}</Hint></Failure>,

		ready: ({ state }) => cards(state.filter(isTaxonomyRow))

	})}</Page>;

}


/**
 * Renders the taxonomies matching the filters in force.
 *
 * @param rows The taxonomies to be rendered, with their size
 *
 * @returns A card for each taxonomy, sorted by label, or the collection glyph if `rows` is empty
 */
function cards(rows: readonly TaxonomyRow[]) {
	return rows.length === 0 ? <Hint>{taxonomies.glyph}</Hint> : <>{[...rows] // copy, as rows are shared

		.sort(by(({ taxonomy }) => taxonomy.label, locale()))

		.map(({ taxonomy: { id, title, alternative, description }, size }) => <Card key={id}

			title={<Link href={id}>{alternative
				? `${alternative} / ${title}`
				: title
			}</Link>}

			tags={`${integer.format(size)} concepts`}

		>{description}</Card>)

	}</>;
}
