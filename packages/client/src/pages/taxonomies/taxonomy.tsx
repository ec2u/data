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
import { opt } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { Path } from "@metreeca/tile-cell/path";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useCollection, useCount, useMembers, useResource } from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { Info } from "@metreeca/tile-hive/info";
import { useEffect, useState } from "preact/hooks";
import { site } from "../../index.core.js";
import { AI } from "../../tiles/ai.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { Search } from "../../tiles/search.js";
import { SKOSConcepts } from "../../tiles/skos/concepts.js";
import { taxonomies } from "./taxonomies.js";


export const taxonomy = immutable({

	route: "/:taxonomy",
	label: "Taxonomy",
	glyph: <Icon.Tags/>,

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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function TaxonomyPage() {

	const route = useRoute();
	const router = useRouter();

	const [keywords, setKeywords] = useState("");

	const resource = useResource({
		entry: route,
		shape: Taxonomy,
		model: taxonomy.model
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

			<Link look={"subtle"} href={taxonomies.route}>{taxonomies.label}</Link>

			{resource({

				ready: ({ state: { title, alternative } }) => alternative ?? title

			})}

		</Path>}

		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Info place={"spread"}>{{

				Concepts: concepts({

					ready: ({ state }) => state.toLocaleString()

				})

			}}</Info>

			{resource({

				ready: ({ state: { version, created, issued, modified } }) => <Info place={"spread"}>{{

					Version: version,
					Created: created,
					Published: issued,
					Modified: modified

				}}</Info>

			})}

		</>}

		info={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Hint>{taxonomy.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{taxonomy.glyph}</Hint></Failure>,

		ready: ({
			state: {
				title, description, publisher, source, rights, license, accessRights, hasTopConcept = []
			}
		}) => <>

			<Card title={title}>{description}</Card>

			<Info>{{

				Publisher: opt(publisher, ({ id, label }) => <Link href={id}>{label}</Link>),
				Copyright: rights,
				License: opt(license, license => license.length > 0 ? <ul>{license.map(({ id, label }) =>
					<li key={id}><Link href={id}>{label}</Link></li>
				)}</ul> : undefined), // a boolean would read as its name
				Source: opt(source, ({ id }) => <Link href={id}>{site(id)}</Link>),
				Access: accessRights

			}}</Info>

			{(keywords || hasTopConcept.some(({ narrower }) => narrower?.length)) && // flat schemes are browsed whole
				<Search placeholder={"Concepts"} value={keywords} onChange={setKeywords}/>
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
		criteria: { "~label": keywords }
	});

	useEffect(() => { collection.filter({ "~label": keywords }); }, [collection, keywords]);

	const members = useMembers(collection, {
		model: { id: {}, notation: {}, prefLabel: {}, narrower: {} }
	});

	return members({

		error: ({ state }) => <Failure problem={state}><Hint>{taxonomy.glyph}</Hint></Failure>,

		ready: ({ state }) => state.length > 0
			? <SKOSConcepts concepts={state}/>
			: <Hint>{taxonomy.glyph} No Matches</Hint>

	});

}
