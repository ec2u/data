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
import { useCollection, useMembers } from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { useEffect } from "preact/hooks";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";


export const universities = immutable({

	route: "/universities/",
	label: "Universities",
	glyph: <Icon.Landmark/>,

	model: {

		id: {},
		label: {},
		definition: {},
		depiction: {},
		country: { id: {}, label: {} },
		city: { id: {}, label: {} }

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function UniversitiesPage() {

	const route = useRoute();
	const router = useRouter();

	const collection = useCollection({
		entry: route,
		shape: Universities,
		field: "resources"
	});

	const members = useMembers(collection, { model: universities.model });


	useEffect(() => router({ title: universities.label }), []);


	return <Page

		head={universities.label}
		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

	>{members({

		blank: () => <Hint>{universities.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{universities.glyph}</Hint></Failure>,

		ready: ({ state }) => state.length === 0 ? <Hint>{universities.glyph}</Hint> : <>{[...state]

			.sort(by(({ city }) => city.label, locale())) // copy, as state is shared

			.map(({ id, label, definition, depiction, country }) => <Card key={id}

				title={<Link look={"strong"} href={id}>{label}</Link>}
				tags={country.label}
				image={depiction[0]}

			>{definition}</Card>)

		}</>

	})}</Page>;

}
