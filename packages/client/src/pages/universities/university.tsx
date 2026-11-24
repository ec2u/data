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

import { Resources } from "@ec2u/data-shared/resources/index.js";
import { University } from "@ec2u/data-shared/universities/index.js";
import { Button } from "@grafctory/clay-widgets/button";
import { Empty } from "@grafctory/clay-widgets/empty";
import { Heading } from "@grafctory/clay-widgets/heading";
import { Icon } from "@grafctory/clay-widgets/icon";
import { Image } from "@grafctory/clay-widgets/image";
import { Infobox } from "@grafctory/clay-widgets/infobox";
import { Link } from "@grafctory/clay-widgets/link";
import { Path } from "@grafctory/clay-widgets/path";
import { useRoute, useRouter } from "@grafctory/clay/router";
import { opt } from "@grafctory/core";
import { useCollection } from "@grafctory/tile/collection";
import { useMembers } from "@grafctory/tile/members";
import { useResource } from "@grafctory/tile/resource";
import { integer } from "@grafctory/tile/types/integer";
import { year } from "@grafctory/tile/types/year";
import { useEffect } from "preact/hooks";
import { byDataset, ec2u, PublicDatasets } from "../../index.core.js";
import { DatasetLink } from "../../widgets/datasets/dataset.js";
import { address, local } from "../../widgets/datasets/links.js";
import { Failure } from "../../widgets/failure.js";
import { Page } from "../../widgets/page.js";
import { isDatasetRow } from "../index.js";
import { universities } from "./index.js";


export function UniversityPage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({

		entry: route,
		shape: University,

		model: {

			id: {},
			label: {},

			depiction: {},
			homepage: {},

			prefLabel: {},
			definition: {},

			inception: {},
			students: {},

			country: { id: {}, label: {} },
			city: { id: {}, label: {} }

		}

	});

	const collection = useCollection({

		entry: "/resources/",
		shape: Resources,

		scope: { "?university": [route], "?dataset": PublicDatasets }

	});

	const members = useMembers(collection, {

		model: {

			"dataset=dataset": {
				id: {},
				title: {},
				alternative: {}
			},

			"size=count:": {}

		}

	});

	const title = resource({

		blank: universities.label, // !!! factor
		error: universities.label, // !!! factor

		ready: ({ state }) => state.label

	});


	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link href={universities.route}>{universities.label}</Link>

		</Path>}

		menu={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLink href={universities.route}/>)}

		tray={resource({

			ready: ({ state: { country, city, inception, students, homepage } }) => <Infobox>{[

				{
					Country: <Link href={country.id}>{country.label}</Link>,
					City: <Link href={city.id}>{city.label}</Link>
				},

				{
					Inception: year.format(inception)
				},

				{
					Students: integer.format(students)
				},

				{
					Web: <ul>{homepage.map(url => <li key={url}>{address(url, local(route))}</li>)}</ul>
				},

				members({

					ready: ({ state }) => [...state.filter(isDatasetRow)] // copy, as rows are shared

						.sort(byDataset)

						.map(({ dataset, size }) => ({

							label:
								<Link href={dataset.id} query={{ university: route }}>{ec2u(dataset.alternative ?? dataset.title)}</Link>,
							value: integer.format(size)

						}))

				}) ?? []

			]}</Infobox>

		})}

	>{resource({

		blank: () => <Empty look={"subtle"}><universities.glyph/></Empty>,
		error: ({ state }) => <Failure problem={state}><Empty><universities.glyph/></Empty></Failure>,

		ready: ({ state: { prefLabel, depiction, definition } }) => <>

			<Heading>{prefLabel}</Heading>

			{opt(depiction[0], src => <Image float={"end"} within={"25rem"} src={src}/>)}

			{definition}

		</>

	})}</Page>;

}
