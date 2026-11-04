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

import { Topic } from "@ec2u/data-shared/taxonomies/index.js";
import { opt } from "@metreeca/core";
import { by, locale } from "@metreeca/core/order";
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
import { useEffect } from "preact/hooks";
import { AI } from "../../tiles/ai.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { blocks } from "../../tiles/sections.js";
import { Title } from "../../tiles/title.js";
import { SKOSConcepts, SKOSLineage } from "../../_/skos/concepts.js";
import { DatasetLink } from "../datasets/dataset.js";
import { taxonomies } from "./index.js";


export function TopicPage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({

		entry: route,
		shape: Topic,

		model: {

			id: {},
			generated: {},

			notation: {},
			prefLabel: {},
			definition: {},

			isDefinedBy: {},

			inScheme: { id: {}, label: {} },

			broaderTransitive: { id: {}, notation: {}, prefLabel: {}, broader: {} },
			narrower: { id: {}, notation: {}, prefLabel: {}, narrower: {} },
			related: { id: {}, label: {} },
			exactMatch: { id: {}, label: {} }

		}

	});

	const title = resource({

		blank: taxonomies.label,
		error: taxonomies.label,

		ready: ({ state }) => state.prefLabel

	});


	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link href={taxonomies.route}>{taxonomies.label}</Link>

			{resource({

				ready: ({ state: { inScheme } }) =>
					<Link href={inScheme.id}>{inScheme.label}</Link>

			})}

		</Path>}

		menu={<DatasetLink href={taxonomies.route}/>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={resource({

			ready: ({ state: { notation } }) => <Info place={"spread"}>{{

				Code: notation

			}}</Info>

		})}

		info={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Hint>{taxonomies.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{taxonomies.glyph}</Hint></Failure>,

		ready: ({
			state: {
				prefLabel, definition, isDefinedBy, broaderTransitive = [], narrower = [], related, exactMatch
			}
		}) => <Stack space={"spacing100"}>

			<Title title={prefLabel}>{opt(definition, text => <Markdown>{text}</Markdown>)}</Title>

			{blocks({

				"Source": opt(isDefinedBy, url => <Link href={url}>{url}</Link>),

				"Broader Concepts": broaderTransitive.length > 0
					? <SKOSLineage concepts={broaderTransitive}/>
					: undefined,

				"Narrower Concepts": narrower.length > 0
					? <SKOSConcepts concepts={narrower}/>
					: undefined,

				"Related Concepts": links(related),
				"Exact Matches": links(exactMatch)

			})}

		</Stack>

	})}</Page>;

}


/**
 * Lists linked concepts in alphabetical order.
 *
 * @returns The list, or `undefined` if no concept is linked, so the property panel leaves the entry out
 */
function links(concepts: readonly { readonly id: string, readonly label: string }[] = []) {

	return concepts.length > 0 ? <ul>{[...concepts] // copy, as state is shared

		.sort(by(({ label }) => label, locale()))

		.map(({ id, label }) => <li key={id}><Link href={id}>{label}</Link></li>)

	}</ul> : undefined;

}
