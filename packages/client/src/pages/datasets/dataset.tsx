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

import { Dataset } from "@ec2u/data-shared/datasets/index.js";
import type { ResourceShape } from "@metreeca/blue/resource";
import { type Lazy, opt } from "@metreeca/core";
import { some, type Some } from "@metreeca/core/arrays";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { Markdown } from "@metreeca/tile-cell/markdown";
import { Toc } from "@metreeca/tile-cell/toc";
import { useRouter } from "@metreeca/tile-data/router";
import { useCollection, useCount, useResource } from "@metreeca/tile-data/store";
import { Info } from "@metreeca/tile-hive/info";
import { date } from "@metreeca/tile-type/date";
import { integer } from "@metreeca/tile-type/integer";
import { type ComponentChildren, Fragment } from "preact";
import { useEffect } from "preact/hooks";
import { site } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { links } from "../../tiles/links.js";
import { Page } from "../../tiles/page.js";
import { getShapeDescription, getShapeName } from "../../tiles/shape.core.js";
import { Shape } from "../../tiles/shape.js";


const model = immutable({

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

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

	return <Link href={`${href.replace(/\/$/, "")}/~`} title={"Info"}><Icon.Info/></Link>;

}



/**
 * Creates the introduction to the dataset listed by a catalogue.
 *
 * Shows what the dataset holds and the terms it is published under, at the `/~` route nested under the route of the
 * catalogue, which the route table of the catalogue declares ahead of the routes of its resources.
 *
 * @param options The view configuration
 *
 * @returns The dataset page
 */
export function DatasetMeta({

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
	 * The shapes describing the resources the dataset holds; none if omitted.
	 */
	shapes?: Some<Lazy<ResourceShape>>

}) {

	const router = useRouter();

	const resource = useResource({
		entry: href,
		shape: Dataset,
		model
	});

	const resources = useCount(useCollection({
		entry: href,
		shape: Dataset,
		field: "resources"
	}));


	const title = resource({

		blank: label,
		error: label,

		ready: ({ state }) => state.title

	});

	useEffect(() => router({ title }), [title]);


	return <Page

		head={title}
		menu={<Link href={href} title={"Data"}><Icon.Eye/></Link>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			{resource({

				ready: ({ state: { created, issued, modified } }) => <Info place={"spread"}>{{

					Published: opt(issued, value => date.format(value)),
					Created: opt(created, value => date.format(value)),
					Modified: opt(modified, value => date.format(value)),

					Resources: resources({

						ready: ({ state }) => integer.format(state)

					}),

				}}</Info>

			})}

			{opt(shapes, shapes => <Toc entries={some(shapes).map(getShapeName).map(name => ({
				label: name,
				href: `#${name}`
			}))}/>)}

		</>}

	>{resource({

		blank: () => <Hint>{glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{glyph}</Hint></Failure>,

		ready: ({ state: { description, publisher, source, rights, license = [], accessRights } }) => <>

			<Markdown>{description}</Markdown>

			<Info>{{

				Publisher: opt(publisher, ({ id, label }) => <Link href={id}>{label}</Link>),
				Copyright: rights,
				License: links(license),
				Source: opt(source, ({ id }) => <Link href={id}>{site(id)}</Link>),
				Access: opt(accessRights, text => <Markdown>{text}</Markdown>)

			}}</Info>

			{opt(shapes, shapes => some(shapes).map(shape => <Fragment key={getShapeName(shape)}>
				<h1 id={getShapeName(shape)}>{getShapeName(shape)}</h1>
				{opt(getShapeDescription(shape), description => <p>{description}</p>)}
				<Shape shape={shape} universe={shapes}/>
			</Fragment>))}

		</>

	})}</Page>;

}
