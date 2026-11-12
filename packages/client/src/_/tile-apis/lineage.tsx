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
import { eager } from "@metreeca/blue/value";
import { TOC, type TOCEntry } from "@metreeca/clay-widgets/toc";
import { type Lazy, opt } from "@metreeca/core";
import type { Some } from "@metreeca/core/arrays";
import {
	getShapeExtenders,
	getShapeParents,
	getShapeReferrers,
	prefixed,
	type ShapeLink,
	tabulate
} from "./shape/index.js";


/**
 * Creates the property sheet of a resource shape.
 *
 * Locates the shape in the model. The sheet states the target class, linked to its definition, the endpoint and the
 * custom checks its resources must pass. It then lists the shapes it extends, the shapes extending it directly and the
 * shapes referring to it, each linked to its documentation. Entries with nothing to state are left out.
 *
 * @param options The widget configuration
 *
 * @returns A table of contents grouping the entries under their labels, or nothing if no entry states any content
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

	const { endpoint, checks } = tabulate(shape);
	const parents = getShapeParents(shape);
	const extenders = getShapeExtenders(shape, universe);
	const referrers = getShapeReferrers(shape, universe);

	const groups: readonly { label: string, entries: readonly TOCEntry[] }[] = [

		{ label: "Classes", entries: opt(eager(shape).class, type => [{ label: prefixed(type), href: type }]) ?? [] },
		{ label: "Endpoint", entries: opt(endpoint, endpoint => [{ label: <code>{endpoint}</code> }]) ?? [] },
		{ label: "Checks", entries: checks.map(check => ({ label: <code>{check}</code> })) },
		{ label: "Extends", entries: parents.map(entry) },
		{ label: "Extended By", entries: extenders.map(entry) },
		{ label: "Referenced By", entries: referrers.map(entry) }

	];

	return <TOC name={"Model"} entries={groups.filter(({ entries }) => entries.length > 0)}/>;

}

/**
 * Lists a shape as a table of contents entry, linked to its documentation where located.
 */
function entry({ name, href }: ShapeLink): TOCEntry {
	return { label: name, href };
}
