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
import { Choice } from "@metreeca/clay-widgets/choice";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Link } from "@metreeca/clay-widgets/link";
import { Path } from "@metreeca/clay-widgets/path";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { useStorage } from "@metreeca/clay/storage";
import { opt } from "@metreeca/core";
import { useEffect } from "preact/hooks";
import { Page } from "../../widgets/page.js";
import { about } from "../about/index.js";
import { getShapeDescription, getShapeName, universe } from "../../_/tile-apis/shape/index.js";
import { ShapeDeclaration } from "../../_/tile-apis/shape/declaration.js";
import { ShapeInfo } from "../../_/tile-apis/lineage.js";
import { ShapeSchema } from "../../_/tile-apis/shape/schema.js";
import { Shape } from "../../_/tile-apis/shape/table.js";
import { Unknown } from "../unknown.js";
import { getModel } from "../../_/tile-apis/index.core.js";
import { models } from "./index.js";


/**
 * Creates the documentation of a shape of the data model served by the hub.
 *
 * Documents the shape identified by the last step of the current route, as `/models/ec2u-university`, falling back
 * to the not-found view if no shape of the model is identified by that step of the route.
 *
 * @returns The model page
 */
export function ModelPage() {

	const route = useRoute();
	const router = useRouter();

	const [format, setFormat] = useStorage<Format>(localStorage, "ec2u-model-format", "properties");

	const shape = getModel(universe, route.replace(/^.*\//, ""));
	const name = opt(shape, getShapeName);


	useEffect(() => router({ title: name }), [name]);


	return shape === undefined ? <Unknown/> : <Page

		head={<Path>

			<Link href={about.route}>{about.label}</Link>

			<Link href={models.route}>{models.label}</Link>

			{name}

		</Path>}

		menu={<Choice name={"Format"} look={"subtle"} options={{
			properties: <Icon.Rows3 aria-label={"Properties"}><title>Properties</title></Icon.Rows3>,
			typescript: <Icon.FileType aria-label={"TypeScript"}><title>TypeScript</title></Icon.FileType>,
			schema: <Icon.FileBraces aria-label={"JSON Schema"}><title>JSON Schema</title></Icon.FileBraces>
		}} value={format} onChange={setFormat}/>}

		tray={<ShapeInfo shape={shape} universe={universe}/>}

	>

		{opt(getShapeDescription(shape), description => <Markdown>{description}</Markdown>)}

		{{
			properties: <Shape shape={shape}/>,
			typescript: <ShapeDeclaration shape={shape}/>,
			schema: <ShapeSchema shape={shape}/>
		}[format]}

	</Page>;

}


/**
 * The formats a shape is documented in.
 */
type Format =
	| "properties"
	| "typescript"
	| "schema"
