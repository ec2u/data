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
import { Button } from "@metreeca/clay-widgets/button";
import { Card } from "@metreeca/clay-widgets/card";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Image } from "@metreeca/clay-widgets/image";
import { Link } from "@metreeca/clay-widgets/link";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { opt } from "@metreeca/core";
import { by, locale } from "@metreeca/core/order";
import { Clear } from "@metreeca/tile-widgets/filters/clear";
import { Range } from "@metreeca/tile-widgets/filters/range";
import { Count } from "@metreeca/tile-widgets/viewers/count";
import { useCollection } from "@metreeca/tile/collection";
import { useCount } from "@metreeca/tile/count";
import { useKeywords } from "@metreeca/tile/keywords";
import { useMembers } from "@metreeca/tile/members";
import { useQuery } from "@metreeca/tile/query";
import { useRange } from "@metreeca/tile/range";
import { integer } from "@metreeca/tile/types/integer";
import { year } from "@metreeca/tile/types/year";
import { useEffect } from "preact/hooks";
import { Search } from "../../_/search.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { DatasetLinks } from "../datasets/dataset.js";
import { universities } from "./index.js";


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

	const members = useMembers(collection, {

		model: {

			id: {},
			label: {},
			comment: {},
			depiction: {},
			country: { id: {}, label: {} },
			city: { id: {}, label: {} }

		}

	});


	useEffect(() => router({ title: universities.label }), []);


	return <Page

		head={universities.label}
		menu={<DatasetLinks/>}

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

		blank: () => <Empty>{universities.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{universities.glyph}</Empty></Failure>,

		ready: ({ state }) => state.length === 0 ? <Empty>{universities.glyph}</Empty> : <>{[...state]

			.sort(by(({ city }) => city.label, locale())) // copy, as state is shared

			.map(({ id, label, comment, depiction, country }) => <Card key={id}

				title={<Link href={id}>{label}</Link>}
				badge={country.label}
				image={opt(depiction[0], src => <Image src={src}/>)}

			>{comment}</Card>)

		}</>

	})}</Page>;

}
