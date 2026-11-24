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
import { Button } from "@grafctory/clay-widgets/button";
import { Card } from "@grafctory/clay-widgets/card";
import { Empty } from "@grafctory/clay-widgets/empty";
import { Icon } from "@grafctory/clay-widgets/icon";
import { Image } from "@grafctory/clay-widgets/image";
import { Link } from "@grafctory/clay-widgets/link";
import { Pill } from "@grafctory/clay-widgets/pill";
import { useRoute, useRouter } from "@grafctory/clay/router";
import { opt } from "@grafctory/core";
import { by, locale } from "@grafctory/core/order";
import { Clear } from "@grafctory/tile-widgets/clear";
import { Facets } from "@grafctory/tile-widgets/facets";
import { Range } from "@grafctory/tile-widgets/range";
import { Search } from "@grafctory/tile-widgets/search";
import { useCollection } from "@grafctory/tile/collection";
import { useMembers } from "@grafctory/tile/members";
import { useQuery } from "@grafctory/tile/query";
import { useRange } from "@grafctory/tile/range";
import { useSearch } from "@grafctory/tile/search";
import { integer } from "@grafctory/tile/types/integer";
import { year } from "@grafctory/tile/types/year";
import { useEffect } from "preact/hooks";
import { DatasetLinks } from "../../widgets/datasets/dataset.js";
import { color } from "../../widgets/datasets/links.js";
import { Size } from "../../widgets/datasets/size.js";
import { Failure } from "../../widgets/failure.js";
import { Page } from "../../widgets/page.js";
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

		gist={query}

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

		blank: () => <Empty look={"subtle"}><universities.glyph/></Empty>,
		error: ({ state }) => <Failure problem={state}><Empty><universities.glyph/></Empty></Failure>,

		ready: ({ state }) => state.length === 0 ? <Empty><universities.glyph/></Empty> : <>{[...state]

			.sort(by(({ city }) => city.label, locale())) // copy, as state is shared

			.map(({ id, label, comment, depiction, country }) => <Card key={id} lines={5}

				title={<Link href={id}>{label}</Link>}
				badge={<Pill color={color(id)}>{country.label}</Pill>}
				image={opt(depiction[0], src => <Image src={src}/>) ?? (comment && <Empty><universities.glyph/></Empty>)}

			>{comment}</Card>)

		}</>

	})}</Page>;

}
