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
import { by, locale } from "@metreeca/core/order";
import { useResource } from "@metreeca/tile/resource";
import { useEffect } from "preact/hooks";
import { SKOSConcepts, SKOSLineage } from "../../_/skos/concepts.js";
import { AI } from "../../widgets/ai.js";
import { Failure } from "../../widgets/failure.js";
import { Page } from "../../widgets/page.js";
import { blocks } from "../../widgets/sections.js";
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

		menu={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLink href={taxonomies.route}/>)}

		tray={resource({

			ready: ({ state: { notation } }) => <Infobox>{{

				Code: notation

			}}</Infobox>

		})}

		info={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Empty look={"subtle"}>{taxonomies.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{taxonomies.glyph}</Empty></Failure>,

		ready: ({
			state: {
				prefLabel, definition, isDefinedBy, broaderTransitive = [], narrower = [], related, exactMatch
			}
		}) => <>

			<Heading>{prefLabel}</Heading>

			{opt(definition, text => <Markdown>{text}</Markdown>)}

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

		</>

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
