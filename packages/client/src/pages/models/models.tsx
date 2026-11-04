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

import { Link } from "@metreeca/tile-cell/link";
import { useRouter } from "@metreeca/tile-data/router";
import { useEffect } from "preact/hooks";
import { Page } from "../../tiles/page.js";
import { getShapeKey, getShapeName, getShapeSummary } from "../../tiles/shape.core.js";
import { getModelTree, type Model, type ModelNode, universe } from "./index.core.js";
import { models } from "./index.js";
import "./models.css";


/**
 * A row of the models table: a documented shape at its place in the inheritance hierarchy.
 */
type Row = {

	/**
	 * The path of pages leading to the row from its root, identifying a shape listed under several parents once each.
	 */
	readonly path: string

	/**
	 * The number of ancestors above the row in the hierarchy.
	 */
	readonly depth: number

	/**
	 * The documented shape.
	 */
	readonly model: Model

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the index of the data model served by the hub.
 *
 * Lists every documented shape in inheritance order, each nested under the shapes it extends, linked to its own page
 * and followed by the summary of its description.
 *
 * @returns The models page
 */
export function ModelsPage() {

	const router = useRouter();


	useEffect(() => router({ title: models.label }), []);


	return <Page head={models.label}>

		<table class={"ec2u-models"}>

			<thead>
				<tr>
					<th>model</th>
					<th>definition</th>
				</tr>
			</thead>

			<tbody>{rows(getModelTree(universe)).map(({ path, depth, model: { href, shape } }) => <tr key={path}>
				<td><span style={{ "--ec2u-models-depth": depth }}><Link href={href}>{getShapeKey(shape) ?? getShapeName(shape)}</Link></span></td>
				<td>{getShapeSummary(shape)}</td>
			</tr>)}</tbody>

		</table>

	</Page>;

}


/**
 * Flattens an inheritance hierarchy into table rows, each node followed by its descendants.
 */
function rows(nodes: readonly ModelNode[], depth = 0, prefix = ""): readonly Row[] {
	return nodes.flatMap(({ model, children }) => {

		const path = `${prefix}${model.href}`;

		return [{ path, depth, model }, ...rows(children, depth + 1, `${path} `)];

	});
}
