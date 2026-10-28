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
		accessRights: {},
		license: { id: {}, label: {} },

		university: { id: {}, label: {} },
		publisher: { id: {}, label: {} },
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
					rights,
					accessRights

				}

			}) => <>

				<Info place={"spread"}>{{

					Source: url.length > 0 ? <ul>{url.map(url =>
						<li key={url}><Link look={"strong"} href={url}>{site(url)}</Link></li>
					)}</ul> : undefined

				}}</Info>

				<Info place={"spread"}>{{

					University: opt(university, ({ id, label }) => <Link look={"strong"} href={id}>{label}</Link>),
					Code: identifier,
					Language: language.length > 0 ? language.join(", ") : undefined

				}}</Info>

				<Info place={"spread"}>{{

					Type: links(type, "strong"),
					Audience: links(audience, "strong"),
					Topics: links(subject, "strong")

				}}</Info>

				<Info place={"spread"}>{{

					Issued: opt(issued, date),
					Updated: opt(modified, date),
					Valid: valid

				}}</Info>

				<Info place={"spread"}>{{

					Publisher: opt(publisher, ({ label }) => label),
					Contact: opt(creator, ({ label }) => label),
					Contributor: contributor.length > 0 ? <ul>{contributor.map(({ id, label }) =>
						<li key={id}>{label}</li>
					)}</ul> : undefined

				}}</Info>

				<Info place={"spread"}>{{

					License: opt(license, ({ id, label }) => <Link look={"strong"} href={id}>{label}</Link>),
					Rights: rights,
					Access: accessRights

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

			<Card title={title}>{description}</Card>

			<Info>{{

				"Related Documents": links(relation)

			}}</Info>

		</>

	})}</Page>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Formats a calendar date for display.
 *
 * @param value The ISO date to be formatted
 *
 * @returns The date in the reader's locale
 */
function date(value: string): string {
	return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
}
