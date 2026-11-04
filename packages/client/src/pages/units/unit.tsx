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
import { by, compound, locale } from "@metreeca/core/order";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { Markdown } from "@metreeca/tile-cell/markdown";
import { Path } from "@metreeca/tile-cell/path";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useResource } from "@metreeca/tile-data/store";
import { Info } from "@metreeca/tile-hive/info";
import { Stack } from "@metreeca/tile-hive/stack";
import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import { site, toUniversity, UniversityModel } from "../../index.core.js";
import { AI } from "../../tiles/ai.js";
import { Failure } from "../../tiles/failure.js";
import { links, list } from "../../tiles/links.js";
import { Page } from "../../tiles/page.js";
import { blocks } from "../../tiles/sections.js";
import { Title } from "../../tiles/title.js";
import { DatasetLink } from "../datasets/dataset.js";
import { units } from "./index.js";


const model = immutable({

	id: {},
	generated: {},

	label: {},
	prefLabel: {},
	altLabel: {},
	definition: {},

	identifier: {},
	homepage: {},

	university: UniversityModel,
	classification: { id: {}, label: {} },
	hasHead: { id: {}, label: {} },

	unitOf: { id: {}, label: {} },
	hasUnit: { id: {}, label: {} },

	subject: { id: {}, label: {}, broaderTransitive: {} },
	keyword: {}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function UnitPage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({
		entry: route,
		shape: Unit,
		model
	});

	const title = resource({

		blank: units.label,
		error: units.label,

		ready: ({ state }) => state.label

	});

	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link href={units.route}>{units.label}</Link>

		</Path>}

		menu={<DatasetLink href={units.route}/>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={resource({

			ready: ({ state: { altLabel, identifier, homepage = [], university, classification = [], hasHead = [] } }) => <>

				<Info place={"spread"}>{{

					Short: altLabel,
					Code: identifier

				}}</Info>

				<Info place={"spread"}>{{

					University: opt(university, value => <Link href={value.id}>{toUniversity(value)}</Link>),
					Type: links(classification)

				}}</Info>

				<Info place={"spread"}>{{

					Head: list(hasHead.map(({ label }) => label))

				}}</Info>

				<Info place={"spread"}>{{

					Info: homepage.length > 0 ? <ul>{homepage.map(url =>
						<li key={url}><Link href={url}>{site(url)}</Link></li>
					)}</ul> : undefined

				}}</Info>

			</>

		})}

		info={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Hint>{units.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{units.glyph}</Hint></Failure>,

		ready: ({ state: { prefLabel, definition, university, unitOf, hasUnit = [], subject = [], keyword = [] } }) => <Stack space={"spacing100"}>

			<Title title={prefLabel}>{opt(definition, text => <Markdown>{text}</Markdown>)}</Title>

			{blocks({

				Topics: topics(subject),
				Keywords: list(keyword),

				"Parent Organizations": links(unitOf.filter(({ id }) => id !== university?.id)),
				"Organizational Units": links(hasUnit)

			})}

		</Stack>

	})}</Page>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Renders the topics a unit is concerned with.
 *
 * @param subject The topics to be listed, with the broader topics each falls under
 *
 * @returns A list of topic links, broader topics first and then by label, or `undefined` if `subject` is empty
 */
function topics(subject: readonly {
	readonly id: string
	readonly label: string
	readonly broaderTransitive?: readonly string[]
}[]): ComponentChildren {

	return subject.length > 0 ? <ul>{[...subject] // copy, as topics are shared

		.sort(compound(
			by(({ broaderTransitive = [] }) => broaderTransitive.length),
			by(({ label }) => label, locale())
		))

		.map(({ id, label }) => <li key={id}><Link href={id}>{label}</Link></li>)

	}</ul> : undefined;

}
