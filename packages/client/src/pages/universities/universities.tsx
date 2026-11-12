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
import { Empty } from "@metreeca/clay-widgets/empty";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Image } from "@metreeca/clay-widgets/image";
import { Link } from "@metreeca/clay-widgets/link";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { opt } from "@metreeca/core";
import { by, locale } from "@metreeca/core/order";
import { Clear } from "@metreeca/tile-widgets/clear";
import { Facets } from "@metreeca/tile-widgets/facets";
import { Range } from "@metreeca/tile-widgets/range";
import { Search } from "@metreeca/tile-widgets/search";
import { useCollection } from "@metreeca/tile/collection";
import { useMembers } from "@metreeca/tile/members";
import { useQuery } from "@metreeca/tile/query";
import { useRange } from "@metreeca/tile/range";
import { useSearch } from "@metreeca/tile/search";
import { integer } from "@metreeca/tile/types/integer";
import { year } from "@metreeca/tile/types/year";
import { useEffect } from "preact/hooks";
import { Card } from "../../_/clay-widgets/card.js";
import { Failure } from "../../widgets/failure.js";
import { Page } from "../../widgets/page.js";
import { Size } from "../../widgets/size.js";
import { color } from "../../widgets/links.js";
import { DatasetLinks } from "../../widgets/dataset.js";
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

	const search = useSearch(collection, "prefLabel");
	const inception = useRange(collection, "inception");
	const students = useRange(collection, "students");

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

		head={<Size label={universities.label} collection={collection}/>}
		menu={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLinks/>)}

		tray={<Facets>

			<Search name={"Name"} search={search}/>

			<Range name={"Inception"} collapsed type={year} range={inception}/>
			<Range name={"Students"} collapsed type={integer} range={students}/>

		</Facets>}

		meta={<Clear collection={collection}/>}

	>{members({

		blank: () => <Empty look={"subtle"}>{universities.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{universities.glyph}</Empty></Failure>,

		ready: ({ state }) => state.length === 0 ? <Empty>{universities.glyph}</Empty> : <>{[...state]

			.sort(by(({ city }) => city.label, locale())) // copy, as state is shared

			.map(({ id, label, comment, depiction, country }) => <Card key={id} lines={5}

				title={<Link href={id}>{label}</Link>}
				badge={country.label}
				color={color(id)}
				image={opt(depiction[0], src => <Image src={src}/>)}
				glyph={universities.glyph}

			>{comment}</Card>)

		}</>

	})}</Page>;

}
