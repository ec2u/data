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
import { Tabs } from "@metreeca/clay-widgets/tabs";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { opt } from "@metreeca/core";
import { useEffect } from "preact/hooks";
import { Page } from "../../tiles/page.js";
import { getShapeDescription, getShapeName, universe } from "../../tiles/shape.core.js";
import { Shape, ShapeDeclaration, ShapeInfo, ShapeSchema } from "../../tiles/shape.js";
import { Unknown } from "../unknown.js";
import { getModel } from "./index.core.js";
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

	const shape = getModel(universe, route.replace(/^.*\//, ""));
	const name = opt(shape, getShapeName);


	useEffect(() => router({ title: name }), [name]);


	return shape === undefined ? <Unknown/> : <Page

		head={<Path>

			<Link href={models.route}>{models.label}</Link>

			{name}

		</Path>}

		tray={<ShapeInfo shape={shape} universe={universe}/>}

	>

		{opt(getShapeDescription(shape), description => <Markdown>{description}</Markdown>)}

		<Tabs panels={{
			Properties: <Shape shape={shape}/>,
			TypeScript: <ShapeDeclaration shape={shape}/>,
			"JSON Schema": <ShapeSchema shape={shape}/>
		}}/>

	</Page>;

}
