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
import { Button } from "@metreeca/clay-widgets/button";
import { Card } from "@metreeca/clay-widgets/card";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Link } from "@metreeca/clay-widgets/link";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { by, locale } from "@metreeca/core/order";
import { Clear } from "@metreeca/tile-widgets/filters/clear";
import { Search } from "@metreeca/tile-widgets/filters/search";
import { Tally } from "@metreeca/tile-widgets/filters/tally";
import { useCollection } from "@metreeca/tile/collection";
import { useMembers } from "@metreeca/tile/members";
import { useQuery } from "@metreeca/tile/query";
import { useSearch } from "@metreeca/tile/search";
import { useTally } from "@metreeca/tile/tally";
import { integer } from "@metreeca/tile/types/integer";
import { useEffect } from "preact/hooks";
import { TallyOptions } from "../../index.core.js";
import { Failure } from "../../widgets/failure.js";
import { Page } from "../../widgets/page.js";
import { Size } from "../../widgets/size.js";
import { DatasetLinks } from "../datasets/dataset.js";
import { taxonomies } from "./index.js";
import { isTaxonomyRow, type TaxonomyRow } from "./taxonomies.core.js";


export function TaxonomiesPage() {

	const route = useRoute();
	const router = useRouter();

	const [query, setQuery] = useQuery();

	const collection = useCollection({

		entry: route,
		shape: Taxonomies,
		field: "resources",

		query,

		onChange: setQuery

	});


	const search = useSearch(collection, "label");
	const license = useTally(collection, "license", { label: "label", size: TallyOptions });
	const publisher = useTally(collection, "publisher", { label: "label", size: TallyOptions });

	const members = useMembers(collection, {

		model: {
			"taxonomy=": { id: {}, label: {}, title: {}, alternative: {}, description: {} },
			"size=count:resources": {}
		}

	});


	useEffect(() => router({ title: taxonomies.label }), []);


	return <Page

		head={<Size label={taxonomies.label} collection={collection}/>}
		menu={<DatasetLinks/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Search name={"Name"} search={search}/>

			<Tally name={"License"} collapsed tally={license}/>
			<Tally name={"Publisher"} collapsed tally={publisher}/>

		</>}

		reset={<Clear collection={collection}/>}

	>{members({

		blank: () => <Empty>{taxonomies.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{taxonomies.glyph}</Empty></Failure>,

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
	return rows.length === 0 ? <Empty>{taxonomies.glyph}</Empty> : <>{[...rows] // copy, as rows are shared

		.sort(by(({ taxonomy }) => taxonomy.label, locale()))

		.map(({ taxonomy: { id, title, alternative, description }, size }) => <Card key={id}

			title={<Link href={id}>{alternative
				? `${alternative} / ${title}`
				: title
			}</Link>}

			badge={`${integer.format(size)} concepts`}

		>{description}</Card>)

	}</>;
}
