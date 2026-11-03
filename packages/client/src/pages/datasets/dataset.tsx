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
import { opt } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { Mark } from "@metreeca/tile-cell/mark";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useCollection, useCount, useResource } from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { Info } from "@metreeca/tile-hive/info";
import { date } from "@metreeca/tile-type/date";
import { integer } from "@metreeca/tile-type/integer";
import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import { site } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { links } from "../../tiles/links.js";
import { Page } from "../../tiles/page.js";


export const dataset = immutable({

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


/**
 * The history state marking a catalogue entry to be opened on the introduction to its dataset.
 */
const Intro = "intro";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Binds a catalogue page to the introduction to its dataset.
 *
 * The introduction is shown as the page is reached through a {@link DatasetLink}, or with no criteria narrowing it,
 * and is kept in the history entry of the page, so that the reader going back to it finds the view they left.
 *
 * @param narrowed `true` if the catalogue starts narrowed by the reader's criteria
 *
 * @returns `true` if the introduction is to be shown, and a setter switching between the introduction and the listing
 */
export function useIntro(narrowed: boolean): readonly [boolean, (intro: boolean) => void] {

	const router = useRouter();

	const [intro, setIntro] = useState(() => history.state === Intro || !narrowed);

	return [intro, update];


	function update(value: boolean): void {
		router({ state: value ? Intro : null });
		setIntro(value);
	}

}


/**
 * Creates a link to the introduction to a dataset.
 *
 * Opens the catalogue of the dataset on its introduction, whatever criteria the reader last narrowed it by.
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

	const router = useRouter();

	return <Link href={href} title={"Info"} onClick={() => router({ route: href, state: Intro })}><Icon.Info/></Link>;

}


/**
 * Creates the introduction to the dataset published at the current route.
 *
 * Shows what the dataset holds and the terms it is published under, in place of the catalogue listing its resources,
 * so a catalogue page renders it while the reader has not yet asked for the resources themselves.
 *
 * @param options The view configuration
 *
 * @returns The dataset page
 */
export function DatasetPage({

	head,
	glyph,

	onBrowse

}: {

	/**
	 * The heading of the page, as the catalogue it introduces is headed.
	 */
	head: ComponentChildren

	/**
	 * The glyph shown while the dataset is loading or failed to load, as the catalogue it introduces shows it.
	 */
	glyph: ComponentChildren

	/**
	 * Moves the reader on to the catalogue listing the resources of the dataset.
	 */
	onBrowse: () => void

}) {

	const route = useRoute();

	const resource = useResource({
		entry: route,
		shape: Dataset,
		model: dataset.model
	});

	const resources = useCount(useCollection({
		entry: route,
		shape: Dataset,
		field: "resources"
	}));


	return <Page

		head={head}
		menu={<Link href={"?"} title={"Data"} onClick={onBrowse}><Icon.Eye/></Link>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={resource({

			ready: ({ state: { created, issued, modified } }) => <Info place={"spread"}>{{

				Published: opt(issued, value => date.format(value)),
				Created: opt(created, value => date.format(value)),

				Resources: resources({

					ready: ({ state }) => integer.format(state)

				}),

				Modified: opt(modified, value => date.format(value))

			}}</Info>

		})}

	>{resource({

		blank: () => <Hint>{glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{glyph}</Hint></Failure>,

		ready: ({ state: { title, description, publisher, source, rights, license = [], accessRights } }) => <>

			<Card title={title}><Mark>{description}</Mark></Card>

			<Info>{{

				Publisher: opt(publisher, ({ id, label }) => <Link href={id}>{label}</Link>),
				Copyright: rights,
				License: links(license),
				Source: opt(source, ({ id }) => <Link href={id}>{site(id)}</Link>),
				Access: opt(accessRights, text => <Mark>{text}</Mark>)

			}}</Info>

		</>

	})}</Page>;

}
