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

import { Link } from "@metreeca/clay-widgets/link";
import { Path } from "@metreeca/clay-widgets/path";
import { useRouter } from "@metreeca/clay/router";
import { useEffect } from "preact/hooks";
import { ShapeIndex } from "../../../_/tile-apis/index.js";
import { universe } from "../../../_/tile-apis/shape/index.js";
import { Page } from "../../../widgets/page.js";
import { about } from "../index.js";
import { models } from "./index.js";


/**
 * Creates the index of the data model served by the hub.
 *
 * Sets out the {@link ShapeIndex | index} of the shapes documented for the hub, each linked to its own page.
 *
 * @returns The models page
 */
export function ModelsPage() {

	const router = useRouter();


	useEffect(() => router({ title: models.label }), []);


	return <Page head={<Path>

		<Link href={about.route}>{about.label}</Link>

		{models.label}

	</Path>}>

		<ShapeIndex universe={universe}/>

	</Page>;

}
