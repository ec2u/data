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
import { Topic } from "@ec2u/data-shared/taxonomies/index.js";
import { opt } from "@metreeca/core";
import { by, locale } from "@metreeca/core/order";
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
import { type Text } from "../../index.core.js";
import { AI } from "../../tiles/ai.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { SKOSConcepts, SKOSLineage } from "../../tiles/skos/concepts.js";
import { taxonomies } from "./taxonomies.js";


export const topic = immutable({

	route: "/:taxonomy/",
	label: "Topic",
	glyph: <Icon.Tag/>,

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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function TopicPage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({
		entry: route,
		shape: Topic,
		model: topic.model
	});

	const title = resource({

		blank: taxonomies.label,
		error: taxonomies.label,

		ready: ({ state }) => english(state.prefLabel)

	});

	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link look={"subtle"} href={taxonomies.route}>{taxonomies.label}</Link>

			{resource({

				ready: ({ state: { inScheme } }) =>
					<Link look={"subtle"} href={inScheme.id}>{english(inScheme.label)}</Link>

			})}

		</Path>}

		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

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

		blank: () => <Hint>{topic.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{topic.glyph}</Hint></Failure>,

		ready: ({
			state: {
				prefLabel, definition, isDefinedBy, broaderTransitive = [], narrower = [], related, exactMatch
			}
		}) => <>

			<Card title={english(prefLabel)}>{opt(definition, english)}</Card>

			<Info>{{

				"Source": opt(isDefinedBy, url => <Link href={url}>{url}</Link>),

				"Broader Concepts": broaderTransitive.length > 0
					? <SKOSLineage concepts={broaderTransitive}/>
					: undefined,

				"Narrower Concepts": narrower.length > 0
					? <SKOSConcepts concepts={narrower}/>
					: undefined,

				"Related Concepts": links(related),
				"Exact Matches": links(exactMatch)

			}}</Info>

		</>

	})}</Page>;

}


/**
 * Lists linked concepts in alphabetical order.
 *
 * @returns The list, or `undefined` if no concept is linked, so the property panel leaves the entry out
 */
function links(concepts: readonly { readonly id: string, readonly label: Text }[] = []) {

	return concepts.length > 0 ? <ul>{[...concepts] // copy, as state is shared

		.sort(by(({ label }) => english(label), locale()))

		.map(({ id, label }) => <li key={id}><Link href={id}>{english(label)}</Link></li>)

	}</ul> : undefined;

}
