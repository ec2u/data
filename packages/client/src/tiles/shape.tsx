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
import { Markdown } from "@metreeca/tile-cell/markdown";
import { Stack } from "@metreeca/tile-hive/stack";
import { Fragment } from "preact";
import { Text } from "../_/text.js";
import { getShapeAncestors, getShapeExtenders, getShapeReferrers, type ShapeLink, type ShapeRow, type ShapeTable, tabulate } from "./shape.core.js";
import "./shape.css";


/**
 * Creates the property sheet of a resource shape.
 *
 * Locates the shape in the model, stating its endpoint, its whole lineage of extended shapes, the shapes extending it
 * and the shapes referring to it, each linked to its documentation; entries with nothing to state are left out.
 *
 * @param options The widget configuration
 *
 * @returns A stack of sections, each its label over its content, or nothing if no entry states any content
 */
export function ShapeInfo({

	shape,
	universe

}: {

	/**
	 * The shape to be located, possibly deferred.
	 */
	shape: Lazy<ResourceShape>

	/**
	 * The entry shapes of the model scanned for the properties referring to the shape, possibly deferred.
	 */
	universe: Some<Lazy<ResourceShape>>

}) {

	const { endpoint } = tabulate(shape);
	const ancestors = getShapeAncestors(shape);
	const extenders = getShapeExtenders(shape, universe);
	const referrers = getShapeReferrers(shape, universe);

	const stated = Object.entries({

		Endpoint: opt(endpoint, endpoint => <code>{endpoint}</code>),
		Extends: ancestors.length > 0 ? <List links={ancestors}/> : undefined,
		"Extended by": extenders.length > 0 ? <List links={extenders}/> : undefined,
		"Referenced by": referrers.length > 0 ? <List links={referrers}/> : undefined

	}).flatMap(([label, content]) => content !== undefined ? [{ label, content }] : []);

	return stated.length > 0 ? <Stack space={"spacing100"}>{stated.map(({ label, content }) =>

		<Stack key={label} space={"spacing050"}>
			<div><Text look={"label"}>{label}</Text></div>{/* body-sized line, sharing the baseline of the page text */}
			{content}
		</Stack>

	)}</Stack> : undefined;

}

/**
 * Creates the documentation of a resource shape.
 *
 * Sets out a table of the properties the shape declares, each with the predicate it maps to, the type and number of
 * its values, and its description. Heading, describing and locating the shape is left to the page, as is linking to
 * it; see {@link ShapeInfo} for its property sheet.
 *
 * @param options The widget configuration
 *
 * @returns The shape documentation
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
 * Sets out the table of the properties of a shape.
 */
function Table({ rows }: ShapeTable) {
	return <>

		{rows.length > 0 && <table class={"ec2u-shape"}>

			<thead>
				<tr>
					<th>property</th>
					<th>type</th>
					<th>#</th>
					<th>description</th>
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
		<td>{opt(description, description => <Markdown>{description}</Markdown>)}</td>
	</tr>;
}

/**
 * Sets out a list of shapes as a bulleted list, each linked to its documentation where located.
 */
function List({ links }: { links: readonly ShapeLink[] }) {
	return <ul class={"ec2u-shape-links"}>{links.map(({ name, href }, index) => <li key={index}>
		{href === undefined ? name : <Link href={href}>{name}</Link>}
	</li>)}</ul>;
}

/**
 * Sets out a list of types inline, each linked to its documentation where located.
 */
function Links({ separator, links }: { separator: string, links: readonly ShapeLink[] }) {
	return <>{links.map(({ name, href }, index) => <Fragment key={index}>
		{index > 0 && separator}
		{href === undefined ? name : <Link href={href}>{name}</Link>}
	</Fragment>)}</>;
}
