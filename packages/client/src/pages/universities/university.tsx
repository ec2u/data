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

import { english } from "@ec2u/data-shared";
import { University } from "@ec2u/data-shared/universities/index.js";
import { opt } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { Path } from "@metreeca/tile-cell/path";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useResource } from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { Info } from "@metreeca/tile-hive/info";
import { useEffect } from "preact/hooks";
import { site } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
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

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function UniversityPage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({
		entry: route,
		shape: University,
		model: university.model
	});

	const title = resource({

		blank: universities.label, // !!! factor
		error: universities.label, // !!! factor

		ready: ({ state }) => english(state.label)

	});

	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link look={"subtle"} href={universities.route}>{universities.label}</Link>

		</Path>}

		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={resource({

			ready: ({ state: { homepage, country, city, inception, students } }) => <>

				<Info place={"spread"}>{{

					Home: <ul>{homepage.map(url => <li key={url}><Link look={"strong"} href={url}>{site(url)}</Link></li>)}</ul>

				}}</Info>

				<Info place={"spread"}>{{

					Country: <Link look={"strong"} href={country.id}>{english(country.label)}</Link>,
					City: <Link look={"strong"} href={city.id}>{english(city.label)}</Link>

				}}</Info>

				<Info place={"spread"}>{{

					Inception: inception,
					Students: students.toLocaleString()

				}}</Info>

				{/* !!! dataset links: per-dataset resource counts need a grouped count over /resources/ not yet available

				<Info place={"spread"}>{stats.map(({ dataset, resources }) => ({

					label: <Link href={`${dataset.id}?university=${encodeURIComponent(id)}`}>{dataset.alternative}</Link>,
					value: resources.toLocaleString()

				}))}</Info>

				*/}

			</>

		})}

	>{resource({

		blank: () => <Hint>{university.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{university.glyph}</Hint></Failure>,

		ready: ({ state: { depiction, prefLabel, definition } }) => <Card

			title={english(prefLabel)}
			image={depiction[0]}

		>{opt(definition, english)}</Card>

	})}</Page>;

}
