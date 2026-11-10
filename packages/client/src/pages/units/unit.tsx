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
import { Markdown } from "@metreeca/clay-markdown/markdown";
import { Button } from "@metreeca/clay-widgets/button";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Heading } from "@metreeca/clay-widgets/heading";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Infobox } from "@metreeca/clay-widgets/infobox";
import { Link } from "@metreeca/clay-widgets/link";
import { Path } from "@metreeca/clay-widgets/path";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { opt } from "@metreeca/core";
import { by, compound, locale } from "@metreeca/core/order";
import { useResource } from "@metreeca/tile/resource";
import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import { AI } from "../../widgets/ai.js";
import { Failure } from "../../widgets/failure.js";
import { address, links, list, local } from "../../widgets/links.js";
import { Page } from "../../widgets/page.js";
import { blocks } from "../../widgets/sections.js";
import { DatasetLink } from "../datasets/dataset.js";
import { units } from "./index.js";


export function UnitPage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({

		entry: route,
		shape: Unit,

		model: {

			id: {},
			generated: {},

			label: {},
			prefLabel: {},
			altLabel: {},
			definition: {},

			identifier: {},
			homepage: {},

			university: { id: {}, altLabel: {} },
			classification: { id: {}, label: {} },
			hasHead: { id: {}, label: {} },

			unitOf: { id: {}, label: {} },
			hasUnit: { id: {}, label: {} },

			subject: { id: {}, label: {}, broaderTransitive: {} },
			keyword: {}

		}

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

		menu={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLink href={units.route}/>)}

		tray={resource({

			ready: ({
				state: {
					altLabel,
					identifier,
					homepage = [],
					university,
					classification = [],
					hasHead = []
				}
			}) => <Infobox>{[

				{
					Short: altLabel,
					Code: identifier
				},

				{
					University: opt(university, value => <Link href={value.id}>{value.altLabel}</Link>),
					Type: links(classification)
				},

				{
					Head: list(hasHead.map(({ label }) => label))
				},

				{
					Info: homepage.length > 0 ? <ul>{homepage.map(url =>
						<li key={url}>{address(url, local(university?.id))}</li>
					)}</ul> : undefined
				}

			]}</Infobox>

		})}

		info={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Empty look={"subtle"}>{units.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{units.glyph}</Empty></Failure>,

		ready: ({ state: { prefLabel, definition, university, unitOf, hasUnit = [], subject = [], keyword = [] } }) =>
			<>

				<Heading>{prefLabel}</Heading>

				{opt(definition, text => <Markdown>{text}</Markdown>)}

				{blocks({

					Topics: topics(subject),
					Keywords: list(keyword),

					"Parent Organizations": links(unitOf.filter(({ id }) => id !== university?.id)),
					"Organizational Units": links(hasUnit)

				})}

			</>

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
