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

import { Document } from "@ec2u/data-shared/documents/index.js";
import { opt } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { Mark } from "@metreeca/tile-cell/mark";
import { Path } from "@metreeca/tile-cell/path";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useResource } from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { Info } from "@metreeca/tile-hive/info";
import { date } from "@metreeca/tile-type/date";
import { useEffect } from "preact/hooks";
import { scope, site, toLanguage, toUniversity, UniversityModel } from "../../index.core.js";
import { AI } from "../../tiles/ai.js";
import { Failure } from "../../tiles/failure.js";
import { filters, links, list } from "../../tiles/links.js";
import { Page } from "../../tiles/page.js";
import { blocks } from "../../tiles/sections.js";
import { documents } from "./documents.js";


export const document = immutable({

	route: "/:document",
	label: "Document",
	glyph: <Icon.Files/>,

	model: {

		id: {},
		generated: {},

		label: {},
		title: {},
		description: {},

		url: {},

		identifier: {},
		language: {},

		issued: {},
		modified: {},
		valid: {},

		rights: {},
		license: { id: {}, label: {} },

		university: UniversityModel,
		publisher: { id: {}, label: {}, url: {} },
		creator: { id: {}, label: {} },
		contributor: { id: {}, label: {} },

		type: { id: {}, label: {} },
		subject: { id: {}, label: {} },
		audience: { id: {}, label: {} },

		relation: { id: {}, label: {} }

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DocumentPage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({
		entry: route,
		shape: Document,
		model: document.model
	});

	const title = resource({

		blank: documents.label,
		error: documents.label,

		ready: ({ state }) => state.label

	});

	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link look={"subtle"} href={documents.route}>{documents.label}</Link>

		</Path>}

		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={resource({

			ready: ({

				state: {

					url = [],

					identifier,
					language = [],

					issued,
					modified,
					valid,

					university,
					publisher,
					creator,
					contributor = [],

					type = [],
					subject = [],
					audience = [],

					license,
					rights

				}

			}) => <>

				<Info place={"spread"}>{{

					University: opt(university, value => <Link look={"strong"} href={value.id}>{toUniversity(value)}</Link>)

				}}</Info>

				<Info place={"spread"}>{{

					Code: identifier,
					Web: url.length > 0 ? <ul>{url.map(url =>
						<li key={url}><Link look={"strong"} href={url}>{site(url)}</Link></li>
					)}</ul> : undefined,
					Language: list(language.map(toLanguage))

				}}</Info>

				<Info place={"spread"}>{{

					Type: filters(type, documents.route, type => ({ ...scope(university), type })),
					Audience: filters(audience, documents.route, audience => ({ ...scope(university), audience })),
					Topics: filters(subject, documents.route, subject => ({ ...scope(university), subject }))

				}}</Info>

				<Info place={"spread"}>{{

					Issued: opt(issued, value => date.format(value)),
					Updated: opt(modified, value => date.format(value)),
					Valid: valid

				}}</Info>

				<Info place={"spread"}>{{

					Publisher: opt(publisher, ({ label, url = [] }) => url.length > 0
						? <Link look={"strong"} href={url[0]}>{label}</Link>
						: label
					),
					Contact: opt(creator, ({ label }) => label),
					Contributor: list(contributor.map(({ label }) => label))

				}}</Info>

				<Info place={"spread"}>{{

					License: opt(license, ({ id, label }) => <Link look={"strong"} href={id}>{label}</Link>),
					Rights: rights

				}}</Info>

			</>

		})}

		info={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Hint>{document.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{document.glyph}</Hint></Failure>,

		ready: ({ state: { title, description, relation = [] } }) => <>

			<Card title={title}>{opt(description, text => <Mark>{text}</Mark>)}</Card>

			{blocks({

				"Related Documents": links(relation)

			})}

		</>

	})}</Page>;

}
