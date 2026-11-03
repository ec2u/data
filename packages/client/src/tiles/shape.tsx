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
import { type Lazy, opt } from "@metreeca/core";
import type { Some } from "@metreeca/core/arrays";
import { Link } from "@metreeca/tile-cell/link";
import { Info } from "@metreeca/tile-hive/info";
import { Fragment } from "preact";
import { getShapeReferrers, type ShapeLink, type ShapeRow, type ShapeTable, tabulate } from "./shape.core.js";


/**
 * Creates the documentation of a resource shape.
 *
 * Opens with a panel stating its endpoint, the shapes it extends and the properties referring to it, followed by a
 * table of the properties it declares, each with the predicate it maps to, the type and number of its values, and its
 * definition. Heading and describing the shape is left to the page, as is linking to it.
 *
 * @param options The widget configuration
 *
 * @returns The shape documentation
 */
export function Shape({

	shape,
	universe

}: {

	/**
	 * The shape to be documented, possibly deferred.
	 */
	shape: Lazy<ResourceShape>

	/**
	 * The entry shapes of the model scanned for the properties referring to the shape, possibly deferred.
	 */
	universe: Some<Lazy<ResourceShape>>

}) {

	return <Table {...tabulate(shape)} referrers={getShapeReferrers(shape, universe)}/>;

}


/**
 * Sets out a shape as a panel locating it in the model, and the table of its properties.
 */
function Table({ endpoint, parents, rows, referrers }: ShapeTable & { referrers: readonly ShapeLink[] }) {
	return <>

		<Info>{{

			Endpoint: opt(endpoint, endpoint => <code>{endpoint}</code>),
			Extends: parents.length > 0 ? <Links separator={", "} links={parents}/> : undefined,
			"Referenced by": referrers.length > 0 ? <Links separator={", "} links={referrers}/> : undefined

		}}</Info>

		{rows.length > 0 && <table>

			<thead>
				<tr>
					<th>property</th>
					<th>type</th>
					<th>#</th>
					<th>definition</th>
				</tr>
			</thead>

			<tbody>{rows.map(row => <Row key={row.term} {...row}/>)}</tbody>

		</table>}

	</>;
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
