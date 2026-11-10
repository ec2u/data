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

import { Taxonomy } from "@ec2u/data-shared/taxonomies/index.js";
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
import { Search } from "@metreeca/tile-widgets/filters/search";
import { useCollection } from "@metreeca/tile/collection";
import { useCount } from "@metreeca/tile/count";
import { useMembers } from "@metreeca/tile/members";
import { useResource } from "@metreeca/tile/resource";
import { date } from "@metreeca/tile/types/date";
import { integer } from "@metreeca/tile/types/integer";
import { useEffect, useState } from "preact/hooks";
import { SKOSConcepts } from "../../_/skos/concepts.js";
import { AI } from "../../widgets/ai.js";
import { Failure } from "../../widgets/failure.js";
import { address } from "../../widgets/links.js";
import { Page } from "../../widgets/page.js";
import { DatasetLink } from "../datasets/dataset.js";
import { taxonomies } from "./index.js";


export function TaxonomyPage() {

	const route = useRoute();
	const router = useRouter();

	const [keywords, setKeywords] = useState("");

	const resource = useResource({

		entry: route,
		shape: Taxonomy,

		model: {

			id: {},
			generated: {},

			title: {},
			alternative: {},
			description: {},

			version: {},
			created: {},
			issued: {},
			modified: {},

			publisher: { id: {}, label: {} },
			source: { id: {} },

			rights: {},
			license: { id: {}, label: {} },
			accessRights: {},

			hasTopConcept: { id: {}, notation: {}, prefLabel: {}, narrower: {} }

		}

	});

	const concepts = useCount(useCollection({

		entry: route,
		shape: Taxonomy,
		field: "hasConcept"

	}));

	const title = resource({

		blank: taxonomies.label,
		error: taxonomies.label,

		ready: ({ state: { title, alternative } }) => alternative ?? title

	});


	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link href={taxonomies.route}>{taxonomies.label}</Link>

			{resource({

				ready: ({ state: { title, alternative } }) => alternative ?? title

			})}

		</Path>}

		menu={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLink href={taxonomies.route}/>)}

		tray={resource({

			ready: ({ state: { version, created, issued, modified } }) => <Infobox>{[

				{
					Version: version,
					Created: opt(created, value => date.format(value)),
					Published: opt(issued, value => date.format(value)),
					Modified: opt(modified, value => date.format(value))
				},

				{
					Concepts: concepts({ ready: ({ state }) => integer.format(state) })
				}

			]}</Infobox>

		})}

		info={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Empty look={"subtle"}>{taxonomies.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{taxonomies.glyph}</Empty></Failure>,

		ready: ({
			state: {
				title, description, publisher, source, rights, license, accessRights, hasTopConcept = []
			}
		}) => <>

			<Heading>{title}</Heading>

			{opt(description, text => <Markdown>{text}</Markdown>)}

			<Infobox wrap>{{

				Publisher: opt(publisher, ({ id, label }) => <Link href={id}>{label}</Link>),
				Copyright: rights,
				License: opt(license, license => license.length > 0 ? <ul>{license.map(({ id, label }) =>
					<li key={id}><Link href={id}>{label}</Link></li>
				)}</ul> : undefined), // a boolean would read as its name
				Source: opt(source, ({ id }) => address(id)),
				Access: opt(accessRights, text => <Markdown>{text}</Markdown>)

			}}</Infobox>

			{(keywords || hasTopConcept.some(({ narrower }) => narrower?.length)) && // flat schemes are browsed whole
                <Search name={"Concepts"} search={{ text: keywords, submit: setKeywords }}/>
			}

			{keywords
				? <TaxonomySearch keywords={keywords}/>
				: <SKOSConcepts concepts={hasTopConcept}/>
			}

		</>

	})}</Page>;

}


/**
 * Lists the concepts of the taxonomy on show whose label matches a set of keywords.
 */
function TaxonomySearch({

	keywords

}: {

	keywords: string

}) {

	const route = useRoute();

	const collection = useCollection({

		entry: route,
		shape: Taxonomy,
		field: "hasConcept",

		query: { "~label": keywords }

	});


	useEffect(() => { collection.filter({ "~label": keywords }); }, [collection, keywords]);

	const members = useMembers(collection, {

		model: { id: {}, notation: {}, prefLabel: {}, narrower: {} }

	});

	return members({

		error: ({ state }) => <Failure problem={state}><Empty>{taxonomies.glyph}</Empty></Failure>,

		ready: ({ state }) => state.length > 0
			? <SKOSConcepts concepts={state}/>
			: <Empty>{taxonomies.glyph} No Matches</Empty>

	});

}
