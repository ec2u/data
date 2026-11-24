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
import { SKOSBrowser, SKOSConceptModel } from "@kxta/tile-skos";
import { Markdown } from "@grafctory/clay-markdown/markdown";
import { Button } from "@grafctory/clay-widgets/button";
import { Empty } from "@grafctory/clay-widgets/empty";
import { Heading } from "@grafctory/clay-widgets/heading";
import { Icon } from "@grafctory/clay-widgets/icon";
import { Infobox } from "@grafctory/clay-widgets/infobox";
import { Link } from "@grafctory/clay-widgets/link";
import { Path } from "@grafctory/clay-widgets/path";
import { useRoute, useRouter } from "@grafctory/clay/router";
import { opt } from "@grafctory/core";
import { useCollection } from "@grafctory/tile/collection";
import { useCount } from "@grafctory/tile/count";
import { useResource } from "@grafctory/tile/resource";
import { integer } from "@grafctory/tile/types/integer";
import { useEffect } from "preact/hooks";
import { DatasetLink } from "../../widgets/datasets/dataset.js";
import { address } from "../../widgets/datasets/links.js";
import { Failure } from "../../widgets/failure.js";
import { Feedback } from "../../widgets/feedback.js";
import { Page } from "../../widgets/page.js";
import { getTaxonomyRelease } from "./index.core.js";
import { taxonomies } from "./index.js";


export function TaxonomyPage() {

	const route = useRoute();
	const router = useRouter();

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

			hasTopConcept: SKOSConceptModel

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

			ready: ({ state }) => <Infobox>{[

				getTaxonomyRelease(state),

				{
					Concepts: concepts({ ready: ({ state }) => integer.format(state) })
				}

			]}</Infobox>

		})}

		more={<Feedback ai={resource({ ready: ({ state: { generated } }) => generated })}/>}

	>{resource({

		blank: () => <Empty look={"subtle"}><taxonomies.glyph/></Empty>,
		error: ({ state }) => <Failure problem={state}><Empty><taxonomies.glyph/></Empty></Failure>,

		ready: ({
			state: {
				id, title, description, publisher, source, rights, license, accessRights, hasTopConcept = []
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

			<SKOSBrowser scheme={id} concepts={hasTopConcept}/>

		</>

	})}</Page>;

}
