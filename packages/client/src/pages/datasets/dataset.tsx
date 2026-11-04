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
import { isNumber, isObject, isString, type Lazy, opt } from "@metreeca/core";
import { some, type Some } from "@metreeca/core/arrays";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { Markdown } from "@metreeca/tile-cell/markdown";
import { Path } from "@metreeca/tile-cell/path";
import { useRouter } from "@metreeca/tile-data/router";
import { useCollection, useCount, useMembers, useResource } from "@metreeca/tile-data/store";
import { Info } from "@metreeca/tile-hive/info";
import { Stack } from "@metreeca/tile-hive/stack";
import { date } from "@metreeca/tile-type/date";
import { integer } from "@metreeca/tile-type/integer";
import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import { Failure } from "../../tiles/failure.js";
import { address, links } from "../../tiles/links.js";
import { Page } from "../../tiles/page.js";
import { getShapeHref, getShapeName } from "../../tiles/shape.core.js";
import "../../tiles/shape.css";
import { about } from "../about/index.js";


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
 * Leads to the page introducing the dataset listed by a catalogue, at an address of its own the reader may bookmark.
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

	return <Link href={`/about/datasets${href.replace(/\/$/, "")}`} title={"Info"}><Icon.Info/></Link>;

}


/**
 * Creates the introduction to the dataset listed by a catalogue.
 *
 * Shows what the dataset holds, the terms it is published under and links to the models describing its resources, at
 * the route the about section declares for it:
 * `/about/datasets/universities` for the catalogue at `/universities/`, `/about/datasets` for the hub catalogue.
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


	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link href={about.route}>{about.label}</Link>

			{title}

		</Path>}

		menu={<Link href={href} title={"Data"}><Icon.Eye/></Link>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={resource({

			ready: ({ state: { created, issued, modified } }) => <Stack space={"spacing100"}>

				<Info place={"spread"}>{{

					Created: opt(created, value => date.format(value)),
					Published: opt(issued, value => date.format(value)),
					Modified: opt(modified, value => date.format(value))

				}}</Info>

				<Info place={"spread"}>{{

					"Data Model": opt(shapes, shapes => <ul class={"ec2u-shape-links"}>{some(shapes).map(shape =>
						<li key={getShapeName(shape)}>
							{opt(getShapeHref(shape), href => <Link href={href}>{getShapeName(shape)}</Link>) ?? getShapeName(shape)}
						</li>
					)}</ul>)

				}}</Info>

				<Info place={"spread"}>{[

					{
						label: <strong>Resources</strong>,
						value: resources({ ready: ({ state }) => integer.format(state) })
					},

					...breakdown({

						ready: ({ state }) => [...state.filter(isUniversityRow)] // copy, as rows are shared
							.sort((x, y) => x.university.altLabel.localeCompare(y.university.altLabel))
							.map(({ university, size }) => ({
								label: <Link href={href} query={{ university: university.id }}>{university.altLabel}</Link>,
								value: integer.format(size)
							}))

					}) ?? []

				]}</Info>

			</Stack>

		})}

	>{resource({

		blank: () => <Hint>{glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{glyph}</Hint></Failure>,

		ready: ({ state: { description, publisher, source, rights, license = [], accessRights } }) => <>

			<Markdown>{description}</Markdown>

			<Info>{{

				Publisher: opt(publisher, ({ id, label }) => <Link href={id}>{label}</Link>),
				Copyright: rights,
				License: links(license),
				Source: opt(source, ({ id }) => address(id)),
				Access: opt(accessRights, text => <Markdown>{text}</Markdown>)

			}}</Info>

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
