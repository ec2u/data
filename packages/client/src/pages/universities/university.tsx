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
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { Path } from "@metreeca/tile-cell/path";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useCollection, useMembers, useResource } from "@metreeca/tile-data/store";
import { Info } from "@metreeca/tile-hive/info";
import { integer } from "@metreeca/tile-type/integer";
import { year } from "@metreeca/tile-type/year";
import { useEffect } from "preact/hooks";
import { ec2u, site } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { Title } from "../../tiles/title.js";
import { DatasetLink } from "../datasets/dataset.js";
import { byDataset, isDatasetRow } from "../datasets/datasets.core.js";
import { universities } from "./universities.js";


export const university = immutable({

	route: "/:name",
	label: "University",
	glyph: <Icon.Landmark/>,

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

	},

	stats: {

		"dataset=dataset": {
			id: {},
			title: {},
			alternative: {}
		},

		"size=count:": {}

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function UniversityData() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({
		entry: route,
		shape: University,
		model: university.model
	});

	const collection = useCollection({
		entry: "/resources/",
		shape: Resources,
		criteria: { "?university": [route] }
	});

	const stats = useMembers(collection, { model: university.stats });

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

		menu={<DatasetLink href={universities.route}/>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={resource({

			ready: ({ state: { homepage, country, city, inception, students } }) => <>

				<Info place={"spread"}>{{

					Home: <ul>{homepage.map(url => <li key={url}><Link href={url}>{site(url)}</Link></li>)}</ul>

				}}</Info>

				<Info place={"spread"}>{{

					Country: <Link href={country.id}>{country.label}</Link>,
					City: <Link href={city.id}>{city.label}</Link>

				}}</Info>

				<Info place={"spread"}>{{

					Inception: year.format(inception),
					Students: integer.format(students)

				}}</Info>

				{stats({

					ready: ({ state }) => <Info place={"spread"}>{[...state.filter(isDatasetRow)] // copy, as rows are shared

						.sort(byDataset)

						.map(({ dataset, size }) => ({

							label: <Link href={dataset.id} query={{ university: route }}>{ec2u(dataset.alternative ?? dataset.title)}</Link>,
							value: integer.format(size)

						}))

					}</Info>

				})}

			</>

		})}

	>{resource({

		blank: () => <Hint>{university.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{university.glyph}</Hint></Failure>,

		ready: ({ state: { depiction, prefLabel, definition } }) => <Title

			title={prefLabel}
			image={depiction[0]}

		>{definition}</Title>

	})}</Page>;

}
