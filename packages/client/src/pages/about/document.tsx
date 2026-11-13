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

import { Markdown } from "@metreeca/clay-markdown/markdown";
import { Link } from "@metreeca/clay-widgets/link";
import { Path } from "@metreeca/clay-widgets/path";
import { Style } from "@metreeca/clay-widgets/style";
import { Text } from "@metreeca/clay-widgets/text";
import { useAsset } from "@metreeca/clay/asset";
import { useRoute } from "@metreeca/clay/router";
import { isNumber, isString } from "@metreeca/core";
import { NotFound } from "@metreeca/http";
import type { ComponentChildren } from "preact";
import { Failure } from "../../widgets/failure.js";
import { Page } from "../../widgets/page.js";
import { Unknown } from "../unknown.js";
import { about } from "./index.js";


export function DocumentPage() {

	const route = useRoute();
	const asset = useAsset(route.endsWith("/") ? `${route}index.md` : `${route}.md`);

	return isString(asset) ? <Page

			head={head(<Markdown meta={"title"}>{asset}</Markdown>)}
			tray={<Markdown meta={"toc-2"}>{asset}</Markdown>}

		><Markdown>{asset}</Markdown></Page>

		: asset === NotFound ? <Unknown/>
			: isNumber(asset) ? <Page head={head()}><Failure problem={{ status: asset }}/></Page>
				: <Page head={head()}/>;


	function head(title?: ComponentChildren) {
		return route === about.route ? <Path>

			{about.label}

			<Style css={{ textLook: "subtle", colorLabel: "colorPlaceholder" }}>
				<Text>Bridging EC2U Campuses</Text>
			</Style>

		</Path> : <Path>

			<Link href={about.route}>{about.label}</Link>

			{folders(route).map(folder => <Folder key={folder} route={folder}/>)}

			{title}

		</Path>;
	}

}


/**
 * Lists the routes of the folders between the about root and a document, outermost first.
 *
 * @param route The route of the document, either a folder route ending with `/` or a page route
 *
 * @returns The folder routes enclosing `route` below {@link about}, excluding `route` itself
 */
function folders(route: string): readonly string[] {

	const steps = route.slice(about.route.length).replace(/\/$/, "").split("/").slice(0, -1);

	return steps.map((_, index) => `${about.route}${steps.slice(0, index+1).join("/")}/`);

}

/**
 * Creates a breadcrumb step linking to a folder, labelled with the `label` or else the `title` of its index document.
 */
function Folder({

	route

}: {

	route: string

}) {

	const asset = useAsset(`${route}index.md`);

	return <Link href={route}>{isString(asset) ? <Markdown meta={({ label, title }) => label ?? title}>{asset}</Markdown> : null}</Link>;

}
