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

import type { ResourceShape } from "@metreeca/blue/resource";
import { Link } from "@metreeca/clay-widgets/link";
import { type Lazy, opt, type Optional } from "@metreeca/core";
import type { Some } from "@metreeca/core/arrays";
import { getModelEntries, getModelTree, type Model, type ModelNode } from "./index.core.js";
import { getShapeName, getShapeSummary } from "./shape/index.js";
import "./index.css";


/**
 * A row of the models table: a documented shape at its place in the hierarchy, or a grouping heading it.
 */
type Row = {

	/**
	 * The path leading to the row from its root, identifying a shape listed under several parents once each.
	 */
	readonly path: string

	/**
	 * The number of ancestors above the row in the hierarchy.
	 */
	readonly depth: number

	/**
	 * The label of a grouping row; ignored for a shape row, labelled by its name.
	 */
	readonly label?: string

	/**
	 * The description of a grouping row; ignored for a shape row, described by its summary.
	 */
	readonly description?: string

	/**
	 * The documented shape; none for a grouping row.
	 */
	readonly model?: Optional<Model>

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the index of a data model.
 *
 * Lists the documented shapes under two groups: the searchable collections the model is entered from, and the
 * resources they hold, each nested under the shapes it extends. Every shape links to its page beside its summary.
 *
 * @param options The widget configuration
 *
 * @returns The model index
 */
export function ShapeIndex({

	universe

}: {

	/**
	 * The entry shapes of the model, possibly deferred.
	 */
	universe: Some<Lazy<ResourceShape>>

}) {

	return <table class={"ec2u-models"}>

		<thead>
			<tr>
				<th>model</th>
				<th>description</th>
			</tr>
		</thead>

		<tbody>{[

			...group(
				"Collections",
				"Searchable, cross-linked collections of Knowledge Hub resources.",
				getModelEntries(universe).map(model => ({ model, children: [] }))
			),

			...group(
				"Resources",
				"Resource types, each nested under the types it extends.",
				getModelTree(universe)
			)

		].map(({ path, depth, label, description, model }) => <tr key={path}>

			<td><span style={{ "--ec2u-models-depth": depth }}>{opt(model, ({ href, shape }) =>
				<Link href={href}>{getShapeName(shape)}</Link>
			) ?? <strong>{label}</strong>}</span></td>

			<td>{opt(model, ({ shape }) => getShapeSummary(shape)) ?? description}</td>

		</tr>)}</tbody>

	</table>;

}


/**
 * Sets out a hierarchy of shapes under a virtual root labelling and describing the group.
 */
function group(label: string, description: string, nodes: readonly ModelNode[]): readonly Row[] {
	return [{ path: label, depth: 0, label, description }, ...rows(nodes, 1, `${label} `)];
}

/**
 * Flattens an inheritance hierarchy into table rows, each node followed by its descendants.
 */
function rows(nodes: readonly ModelNode[], depth: number, prefix: string): readonly Row[] {
	return nodes.flatMap(({ model, children }) => {

		const path = `${prefix}${model.href}`;

		return [{ path, depth, model }, ...rows(children, depth+1, `${path} `)];

	});
}
