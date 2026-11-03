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
import type { Lazy } from "@metreeca/core";
import { Link } from "@metreeca/tile-cell/link";
import { Fragment } from "preact";
import { type ShapeLink, type ShapeRow, type ShapeTable, tabulate } from "./shape.core.js";


/**
 * Creates the documentation table of a resource shape.
 *
 * Opens with the shape itself, linked to its class, with the shapes it extends and its definition, followed by the
 * properties it declares, as the dataset docs pages do: each property with the predicate it maps to, the type and
 * number of its values, and its definition. Heading the table is left to the page, as is linking to it.
 *
 * @param options The widget configuration
 *
 * @returns The shape documentation table
 */
export function Shape({

	shape

}: {

	/**
	 * The shape to be documented, possibly deferred.
	 */
	shape: Lazy<ResourceShape>

}) {

	return <Table {...tabulate(shape)}/>;

}


/**
 * Sets out a shape as the table of its properties.
 */
function Table({ name, description, class: type, parents, rows }: ShapeTable) {
	return <table>

			<thead>
				<tr>
					<th>term</th>
					<th>type</th>
					<th>#</th>
					<th>definition</th>
				</tr>
			</thead>

			<tbody>

				<tr>
					<td><strong>{type === undefined ? name : <Link href={type}>{name}</Link>}</strong></td>
					<td><Links separator={", "} links={parents}/></td>
					<td/>
					<td>{description}</td>
				</tr>

				{rows.map(row => <Row key={row.term} {...row}/>)}

			</tbody>

		</table>;
}

/**
 * Sets out a property as a table row.
 */
function Row({ term, predicate, types, cardinality, description }: ShapeRow) {
	return <tr>
		<td>{predicate === undefined ? term : <Link href={predicate}>{term}</Link>}</td>
		<td><Links separator={" | "} links={types}/></td>
		<td>{cardinality}</td>
		<td>{description}</td>
	</tr>;
}

/**
 * Sets out a list of types, each linked to its documentation where located.
 */
function Links({ separator, links }: { separator: string, links: readonly ShapeLink[] }) {
	return <>{links.map(({ name, href }, index) => <Fragment key={index}>
		{index > 0 && separator}
		{href === undefined ? name : <Link href={href}>{name}</Link>}
	</Fragment>)}</>;
}
