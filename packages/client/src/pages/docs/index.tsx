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

import { immutable } from "@metreeca/core/values";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { Markdown } from "@metreeca/tile-cell/markdown";
import { Path } from "@metreeca/tile-cell/path";
import { useRoute } from "@metreeca/tile-data/router";
import { useEffect, useState } from "preact/hooks";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { unknown } from "../index.js";


export const docs = immutable({

	routes: {
		about: "/about/",
		datasets: "/datasets/"
	},
	label: "Docs",
	glyph: <Icon.Help/>

});


/**
 * Resolves the Markdown asset documenting a route: `/about/ai` to `/about/ai.md`, `/about/` to `/about/index.md`.
 */
function source(route: string): string {
	return route.endsWith("/") ? `${route}index.md` : `${route}.md`;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Docs() {

	const route = useRoute();

	const [text, setText] = useState<undefined | null | string>(undefined);

	useEffect(() => {

		const controller = new AbortController();

		setText(undefined);

		fetch(source(route), { signal: controller.signal, headers: { accept: "text/markdown" } })
			.then(response => response.ok ? response.text() : null)
			.then(setText)
			.catch(() => {
				if ( !controller.signal.aborted ) { setText(null); }
			});

		return () => controller.abort();

	}, [route]);


	const [section, label] = route.startsWith(docs.routes.datasets)
		? [docs.routes.datasets, "Datasets"]
		: [docs.routes.about, "About"];

	return <Page

		head={<Path>

			<Link look={"subtle"} href={section}>{label}</Link>

			{typeof text === "string" && <Markdown meta={"title"}>{text}</Markdown>}

		</Path>}

		tray={typeof text === "string" && <Markdown meta={"toc"}>{text}</Markdown>}

	>{

		text === null ? <Failure problem={unknown.problem}/>
			: text === undefined ? null
				: <Markdown>{text}</Markdown>

	}</Page>;

}
