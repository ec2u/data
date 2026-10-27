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
import { useCollection, useCount, useMembers } from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { useCallback, useEffect, useState } from "preact/hooks";
import { site } from "../../index.core.js";
import { Count } from "../../tiles/count.js";
import { Failure } from "../../tiles/failure.js";
import { Options } from "../../tiles/options.js";
import { Page } from "../../tiles/page.js";
import { Search } from "../../tiles/search.js";
import {
	type Facet,
	type Filters,
	getCriteria,
	getOptions,
	isFacetRow,
	isFiltered,
	isTaxonomyRow,
	NoFilters,
	select
} from "./taxonomies.core.js";


export const taxonomies = immutable({

	route: "/taxonomies/",
	label: "Taxonomies",
	glyph: <Icon.Tags/>

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function TaxonomiesPage() {

	const route = useRoute();
	const router = useRouter();

	const [filters, setFilters] = useState<Filters>(NoFilters);

	const collection = useCollection({
		entry: route,
		shape: Taxonomies,
		field: "resources",
		scope: getCriteria(filters)
	});

	const members = useMembers(collection, {
		model: {
			"taxonomy=": { id: {}, label: {}, title: {}, alternative: {}, description: {} },
			"size=count:resources": {}
		}
	});

	const count = useCount(collection);

	const licenses = useFacet("license", filters);
	const publishers = useFacet("publisher", filters);

	useEffect(() => router({ title: taxonomies.label }), []);


	const search = useCallback((keywords: string) => setFilters(filters => ({ ...filters, keywords })), []);

	function choose(facet: Facet) {
		return (value: string, selected: boolean) => setFilters(filters => select(filters, facet, value, selected));
	}

	function reset(facet: Facet) {
		return () => setFilters(filters => ({ ...filters, facets: { ...filters.facets, [facet]: [] } }));
	}

	function clear() {
		setFilters(NoFilters);
	}


	return <Page

		head={taxonomies.label}
		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Search placeholder={"Name"} value={filters.keywords} onChange={search}/>

			<Options name={"License"} onSelect={choose("license")} onReset={reset("license")}

				options={licenses({

					ready: ({ state }: { state: readonly unknown[] }) => getOptions(state.filter(isFacetRow), filters.facets.license)
						.map(option => ({ ...option, label: option.value }))

				})}

			/>

			<Options name={"Publisher"} onSelect={choose("publisher")} onReset={reset("publisher")}

				options={publishers({

					ready: ({ state }: { state: readonly unknown[] }) => getOptions(state.filter(isFacetRow), filters.facets.publisher)
						.map(option => ({ ...option, label: site(option.value) }))

				})}

			/>

		</>}

		info={<>

			<Count filtered={isFiltered(filters)}>{count({

				ready: ({ state }) => state

			})}</Count>

			<Button disabled={!isFiltered(filters)} icon={<Icon.Clear/>} title={"Clear Filters"} onClick={clear}/>

		</>}

	>{members({

		blank: () => <Hint>{taxonomies.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{taxonomies.glyph}</Hint></Failure>,

		ready: ({ state }) => <>{state

			.filter(isTaxonomyRow)

			.sort(by(({ taxonomy }) => taxonomy.label, locale()))

			.map(({ taxonomy: { id, title, alternative, description }, size }) => <Card key={id}

				title={<Link look={"strong"} href={id}>{alternative
					? `${alternative} / ${title}`
					: title
				}</Link>}

				tags={`${size.toLocaleString()} concepts`}

			>{description}</Card>)

		}</>

	})}</Page>;

}


/**
 * Retrieves the values a facet takes over the taxonomies matching the filters in force on the other facets.
 */
function useFacet(facet: Facet, filters: Filters) {

	const route = useRoute();

	const collection = useCollection({
		entry: route,
		shape: Taxonomies,
		field: "resources",
		scope: getCriteria(filters, facet)
	});

	return useMembers(collection, {
		model: {
			[`value=${facet}`]: {},
			"count=count:": {}
		}
	});

}
