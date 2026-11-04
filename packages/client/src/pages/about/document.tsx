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

import { isNumber, isString } from "@metreeca/core";
import { NotFound } from "@metreeca/http";
import { Link } from "@metreeca/tile-cell/link";
import { Markdown } from "@metreeca/tile-cell/markdown";
import { Path } from "@metreeca/tile-cell/path";
import { useAsset } from "@metreeca/tile-data/asset";
import { useRoute } from "@metreeca/tile-data/router";
import type { ComponentChildren } from "preact";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { Unknown } from "../index.js";
import { about } from "./index.js";


export function DocumentPage() {

	const route = useRoute();
	const asset = useAsset(route.endsWith("/") ? `${route}index.md` : `${route}.md`);

	return isString(asset) ? <Page

			head={head(<Markdown meta={"title"}>{asset}</Markdown>)}
			tray={<Markdown meta={"toc"}>{asset}</Markdown>}

		><Markdown>{asset}</Markdown></Page>

		: asset === NotFound ? <Unknown/>
			: isNumber(asset) ? <Page head={head()}><Failure problem={{ status: asset }}/></Page>
				: <Page head={head()}/>;


	function head(title?: ComponentChildren) {
		return route === about.route ? about.label : <Path>

			<Link href={about.route}>{about.label}</Link>

			{title}

		</Path>;
	}

}
