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

import { Unit } from "@ec2u/data-shared/units/index.js";
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
import { AI } from "../../tiles/ai.js";
import { Failure } from "../../tiles/failure.js";
import { links } from "../../tiles/links.js";
import { Page } from "../../tiles/page.js";
import { units } from "./units.js";


export const unit = immutable({

	route: "/:unit",
	label: "Unit",
	glyph: <Icon.FlaskConical/>,

	model: {

		id: {},
		generated: {},

		label: {},
		prefLabel: {},
		altLabel: {},
		definition: {},

		identifier: {},
		homepage: {},

		university: { id: {}, label: {} },
		classification: { id: {}, label: {} },
		hasHead: { id: {}, label: {} },

		unitOf: { id: {}, label: {} },
		hasUnit: { id: {}, label: {} },

		subject: { id: {}, label: {} },
		keyword: {}

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function UnitPage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({
		entry: route,
		shape: Unit,
		model: unit.model
	});

	const title = resource({

		blank: units.label,
		error: units.label,

		ready: ({ state }) => state.label

	});

	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link look={"subtle"} href={units.route}>{units.label}</Link>

		</Path>}

		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={resource({

			ready: ({ state: { altLabel, identifier, homepage = [], university, classification = [], hasHead = [] } }) => <>

				<Info place={"spread"}>{{

					Home: homepage.length > 0 ? <ul>{homepage.map(url =>
						<li key={url}><Link look={"strong"} href={url}>{site(url)}</Link></li>
					)}</ul> : undefined

				}}</Info>

				<Info place={"spread"}>{{

					Short: altLabel,
					Code: identifier

				}}</Info>

				<Info place={"spread"}>{{

					University: opt(university, ({ id, label }) => <Link look={"strong"} href={id}>{label}</Link>),
					Type: links(classification, "strong")

				}}</Info>

				<Info place={"spread"}>{{

					Head: hasHead.length > 0 ? <ul>{hasHead.map(({ id, label }) => <li key={id}>{label}</li>)}</ul> : undefined

				}}</Info>

			</>

		})}

		info={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Hint>{unit.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{unit.glyph}</Hint></Failure>,

		ready: ({ state: { prefLabel, definition, university, unitOf, hasUnit = [], subject = [], keyword = [] } }) => <>

			<Card title={prefLabel}>{definition}</Card>

			<Info>{{

				Topics: links(subject),
				Keywords: keyword.length > 0 ? <ul>{keyword.map(keyword => <li key={keyword}>{keyword}</li>)}</ul> : undefined,

				"Parent Organizations": links(unitOf.filter(({ id }) => id !== university?.id)),
				"Organizational Units": links(hasUnit)

			}}</Info>

		</>

	})}</Page>;

}
