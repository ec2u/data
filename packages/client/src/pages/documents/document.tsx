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
import { nameTag } from "@metreeca/core/language";
import { useResource } from "@metreeca/tile/resource";
import { date } from "@metreeca/tile/types/date";
import { useEffect } from "preact/hooks";
import { AI } from "../../widgets/datasets/ai.js";
import { Failure } from "../../widgets/failure.js";
import { address, filters, links, list } from "../../widgets/datasets/links.js";
import { Page } from "../../widgets/page.js";
import { DatasetLink } from "../../widgets/datasets/dataset.js";
import { documents } from "./index.js";


export function DocumentPage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({

		entry: route,
		shape: Document,

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

			university: { id: {}, altLabel: {} },
			publisher: { id: {}, label: {}, url: {} },
			creator: { id: {}, label: {} },
			contributor: { id: {}, label: {} },

			type: { id: {}, label: {} },
			subject: { id: {}, label: {} },
			audience: { id: {}, label: {} },

			relation: { id: {}, label: {} }

		}

	});

	const title = resource({

		blank: documents.label,
		error: documents.label,

		ready: ({ state }) => state.label

	});


	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link href={documents.route}>{documents.label}</Link>

		</Path>}

		menu={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLink href={documents.route}/>)}

		tray={resource({

			ready: ({

				state: {

					university,
					identifier,

					type = [],
					audience = [],
					subject = [],

					issued,
					modified,
					valid,

					language = [],

					publisher,
					creator,
					contributor = [],

					url = [],
					license,
					rights

				}

			}) => <Infobox>{[

				{
					University: opt(university, value => <Link href={value.id}>{value.altLabel}</Link>),
					Code: identifier
				},

				{
					Type: filters(type, documents.route, type => ({
						...opt(university, ({ id }) => ({ university: id })),
						type
					})),
					Audience: filters(audience, documents.route, audience => ({
						...opt(university, ({ id }) => ({ university: id })),
						audience
					})),
					Topics: filters(subject, documents.route, subject => ({
						...opt(university, ({ id }) => ({ university: id })),
						subject
					}))
				},

				{
					Issued: opt(issued, value => date.format(value)),
					Updated: opt(modified, value => date.format(value)),
					Valid: valid
				},

				{
					Language: list(language.map(tag => nameTag(tag, navigator.language)))
				},

				{
					Publisher: opt(publisher, ({ label, url = [] }) => url.length > 0
						? <Link href={url[0]}>{label}</Link>
						: label
					),
					Contact: opt(creator, ({ label }) => label),
					Contributor: list(contributor.map(({ label }) => label))
				},

				{
					Web: url.length > 0 ? <ul>{url.map(url =>
						<li key={url}>{address(url, language.length === 1 ? language[0] : undefined)}</li>
					)}</ul> : undefined,
					License: opt(license, ({ id, label }) => <Link href={id}>{label}</Link>),
					Copyright: rights
				}

			]}</Infobox>

		})}

		more={resource({

			ready: ({ state: { generated } }) => generated ? <AI/> : null

		})}

	>{resource({

		blank: () => <Empty look={"subtle"}>{documents.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{documents.glyph}</Empty></Failure>,

		ready: ({ state: { title, description, relation = [] } }) => <>

			<Heading>{title}</Heading>

			{opt(description, text => <Markdown>{text}</Markdown>)}

			<Infobox wrap>{{

				"Related Documents": links(relation)

			}}</Infobox>

		</>

	})}</Page>;

}
