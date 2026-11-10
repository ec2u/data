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

import { Dataset } from "@ec2u/data-shared";
import { Resources } from "@ec2u/data-shared/resources/index.js";
import type { ResourceShape } from "@metreeca/blue/resource";
import { Markdown } from "@metreeca/clay-markdown/markdown";
import { Button } from "@metreeca/clay-widgets/button";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Infobox } from "@metreeca/clay-widgets/infobox";
import { Link } from "@metreeca/clay-widgets/link";
import { Stack } from "@metreeca/clay-widgets/stack";
import { useAnnex, useRoute, useRouter } from "@metreeca/clay/router";
import { isNumber, isObject, isString, type Lazy, opt } from "@metreeca/core";
import { some, type Some } from "@metreeca/core/arrays";
import { useCollection } from "@metreeca/tile/collection";
import { useCount } from "@metreeca/tile/count";
import { useMembers } from "@metreeca/tile/members";
import { useResource } from "@metreeca/tile/resource";
import { date } from "@metreeca/tile/types/date";
import { integer } from "@metreeca/tile/types/integer";
import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import { ec2u } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { address, links } from "../../tiles/links.js";
import { Page } from "../../tiles/page.js";
import { getShapeHref, getShapeName } from "../../tiles/shape.core.js";
import "../../tiles/shape.css";
import { models } from "../models/index.js";


const InfoAnnex = "info";


/**
 * The dataset metadata the client presents a dataset with, as exported by the module of each dataset catalogue.
 */
export type About = {

	/**
	 * The address of the dataset, which is also the route of the catalogue listing its resources.
	 */
	readonly route: string

	/**
	 * The name the dataset is headed and titled with.
	 */
	readonly label: string

	/**
	 * The glyph standing for the dataset, shown where there is nothing else to show.
	 */
	readonly glyph: ComponentChildren

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a link to the introduction to a dataset.
 *
 * Leads to the page introducing the dataset listed by a catalogue, at the catalogue route carrying the `;info` annex,
 * as `/universities/;info` or `/;info` for the hub catalogue, an address of its own the reader may bookmark.
 *
 * @param options The link configuration
 *
 * @returns The link
 */
export function DatasetLink({

	href

}: {

	/**
	 * The route of the catalogue listing the resources of the dataset.
	 */
	href: string

}) {

	return <Link href={`${href};${InfoAnnex}`} title={"Info"}><Icon.Info/></Link>;

}


/**
 * Creates a link toggling a catalogue between its data and the introduction to its dataset.
 *
 * Leads from the data to the same route with the `;info` annex, and back to the plain route, where the catalogue
 * recovers from its stored state the filters it showed before the switch, as the annexed route leaves them behind.
 *
 * @returns The toggle link
 */
export function DatasetToggle() {

	const route = useRoute();
	const annex = useAnnex();

	return annex === InfoAnnex
		? <Link href={route} title={"Data"}><Icon.Eye/></Link>
		: <Link href={`${route};${InfoAnnex}`} title={"Info"}><Icon.Info/></Link>;

}


/**
 * Creates the introduction to the dataset listed by a catalogue.
 *
 * Shows what the dataset holds, the terms it is published under and links to the models describing its resources, at
 * the catalogue route carrying the `;info` annex, where {@link DatasetToggle} switches back to the listed data.
 *
 * @param options The view configuration
 *
 * @returns The dataset page
 */
export function DatasetPage({

	about: {
		route: href,
		label,
		glyph
	},

	shapes

}: {

	/**
	 * The metadata of the dataset to be introduced.
	 */
	about: About

	/**
	 * The shapes describing the resources the dataset holds, linked to the pages documenting them; none if omitted.
	 */
	shapes?: Some<Lazy<ResourceShape>>

}) {

	const router = useRouter();

	const resource = useResource({

		entry: href,
		shape: Dataset,

		model: {

			title: {},
			description: {},

			created: {},
			issued: {},
			modified: {},

			publisher: { id: {}, label: {} },
			source: { id: {} },

			rights: {},
			license: { id: {}, label: {} },
			accessRights: {}

		}

	});

	const resources = useCount(useCollection({

		entry: href,
		shape: Dataset,
		field: "resources"

	}));

	const breakdown = useMembers(useCollection({

		entry: "/resources/",
		shape: Resources,

		scope: { "?dataset": [href] }

	}), {

		model: {

			"university=university": {
				id: {},
				altLabel: {}
			},

			"size=count:": {}

		}

	});


	const title = resource({

		blank: label,
		error: label,

		ready: ({ state }) => state.title

	});


	const universities = breakdown({

		ready: ({ state }) => [...state.filter(isUniversityRow)] // copy, as rows are shared
			.sort((x, y) => x.university.altLabel.localeCompare(y.university.altLabel))
			.map(({ university, size }) => ({
				label: <Link href={href} query={{ university: university.id }}>{university.altLabel}</Link>,
				value: integer.format(size)
			}))

	}) ?? [];


	useEffect(() => router({ title }), [title]);


	return <Page

		head={title}
		menu={<DatasetToggle/>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={resource({

			ready: ({ state: { created, issued, modified } }) => <Stack space={"spacing100"}>

				<Infobox>{{

					Created: opt(created, value => date.format(value)),
					Published: opt(issued, value => date.format(value)),
					Modified: opt(modified, value => date.format(value))

				}}</Infobox>

				<Infobox>{{

					"Data Model": opt(shapes, shapes => <ul class={"ec2u-shape-links"}>{some(shapes).map(shape =>
						<li key={getShapeName(shape)}>
							{opt(getShapeHref(shape), href =>
								<Link href={`${models.route}${href}`}>{ec2u(getShapeName(shape))}</Link>
							) ?? ec2u(getShapeName(shape))}
						</li>
					)}</ul>)

				}}</Infobox>

				<Infobox>{[

					{
						label: universities.length > 0 ? <strong>Resources</strong> : "Resources",
						value: resources({ ready: ({ state }) => integer.format(state) })
					},

					...universities

				]}</Infobox>

			</Stack>

		})}

	>{resource({

		blank: () => <Empty>{glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{glyph}</Empty></Failure>,

		ready: ({ state: { description, publisher, source, rights, license = [], accessRights } }) => <>

			<Markdown>{description}</Markdown>

			<Infobox wrap align={"end"}>{{

				Publisher: opt(publisher, ({ id, label }) => <Link href={id}>{label}</Link>),
				Copyright: rights,
				License: links(license),
				Source: opt(source, ({ id }) => address(id)),
				Access: opt(accessRights, text => <Markdown>{text}</Markdown>)

			}}</Infobox>

		</>

	})}</Page>;

}


/**
 * A row of the breakdown of the resources of a dataset, counting the ones associated with a university.
 */
type UniversityRow = {

	readonly university: {
		readonly id: string
		readonly altLabel: string
	}

	readonly size: number

};

/**
 * Checks if a value is a breakdown row naming the university it counts, as opposed to the one counting the resources
 * associated with no university.
 */
function isUniversityRow(value: unknown): value is UniversityRow {
	return isObject(value, {

		university: university => isObject(university, {
			id: isString,
			altLabel: isString
		}),

		size: isNumber

	});
}
