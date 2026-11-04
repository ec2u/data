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

import { Universities } from "@ec2u/data-shared/universities/index.js";
import { by, locale } from "@metreeca/core/order";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useCollection, useCount, useKeywords, useMembers, useQuery, useRange } from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { Clear } from "@metreeca/tile-lens/clear";
import { Count } from "@metreeca/tile-lens/count";
import { Range } from "@metreeca/tile-lens/range";
import { integer } from "@metreeca/tile-type/integer";
import { year } from "@metreeca/tile-type/year";
import { useEffect } from "preact/hooks";
import { Search } from "../../_/search.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { DatasetLink } from "../datasets/dataset.js";
import { universities } from "./index.js";


const model = immutable({

	id: {},
	label: {},
	definition: {},
	depiction: {},
	country: { id: {}, label: {} },
	city: { id: {}, label: {} }

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function UniversitiesPage() {

	const route = useRoute();
	const router = useRouter();

	const [query, setQuery] = useQuery();

	const collection = useCollection({
		entry: route,
		shape: Universities,
		field: "resources",
		query,
		onChange: setQuery
	});

	const keywords = useKeywords(collection, "prefLabel");
	const inception = useRange(collection, "inception");
	const students = useRange(collection, "students");
	const count = useCount(collection);

	const members = useMembers(collection, { model });


	useEffect(() => router({ title: universities.label }), []);


	return <Page

		head={universities.label}
		menu={<DatasetLink href={universities.route}/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Search placeholder={"Name"} value={keywords.text} onChange={keywords.search}/>

			<Range name={"Inception"} compact type={year} range={inception}/>
			<Range name={"Students"} compact type={integer} range={students}/>

		</>}

		info={<>
			<Count collection={collection} count={count}/>
			<Clear collection={collection}/>
		</>}

	>{members({

		blank: () => <Hint>{universities.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{universities.glyph}</Hint></Failure>,

		ready: ({ state }) => state.length === 0 ? <Hint>{universities.glyph}</Hint> : <>{[...state]

			.sort(by(({ city }) => city.label, locale())) // copy, as state is shared

			.map(({ id, label, definition, depiction, country }) => <Card key={id}

				title={<Link href={id}>{label}</Link>}
				tags={country.label}
				image={depiction[0]}

			>{definition}</Card>)

		}</>

	})}</Page>;

}
