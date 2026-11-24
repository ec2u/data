/*
 * Copyright © 2026 Metreeca srl
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

import type { ResourceShape } from "@grafctory/blue/resource";
import { eager } from "@grafctory/blue/value";
import { TOC, type TOCEntry } from "@grafctory/clay-widgets/toc";
import { opt } from "@grafctory/core";
import type { Lexicon } from "@grafctory/core/resource";
import type { Endpoints } from "./endpoints.core.js";
import { getEndpointAnchor, getShapeEndpoints } from "./endpoints.core.js";
import {
	getShape,
	getShapeChecks,
	getShapeExtenders,
	getShapeParents,
	getShapeReferrers,
	prefixed
} from "./shapes.core.js";
import "./index.css";


/**
 * Creates the property sheet of a resource shape.
 *
 * Locates the shape in the model. The sheet states the routes serving its resources, linked to their entry among the
 * API routes of the models index, the target class, linked to its definition, and the custom checks its resources must
 * pass. It then lists the shapes it extends, the shapes extending it directly and the shapes referring to it,
 * each linked to its documentation. Entries with nothing to state are left out.
 *
 * Sets out nothing if no shape of the model carries the given identifier.
 *
 * @param options The widget configuration
 *
 * @returns A table of contents grouping the entries under their labels, or nothing if no entry states any content
 */
export function ShapeInfo({

	id,
	endpoints,
	lexicon

}: {

	/**
	 * The identifier of the shape to be located, as the last step of the route of its documentation page.
	 */
	id: string

	/**
	 * The routes served by the API, each mapped to the shape of the resources it serves.
	 */
	endpoints: Endpoints

	/**
	 * The prefixes abbreviating the IRIs of the model.
	 */
	lexicon: Lexicon

}) {
	return opt(getShape(endpoints, lexicon, id), shape =>
		<Info endpoints={endpoints} lexicon={lexicon} shape={shape}/>
	) ?? null;
}

/**
 * Sets out the property sheet of a shape of the model.
 */
function Info({

	endpoints,
	lexicon,
	shape

}: {

	/**
	 * The routes served by the API, each mapped to the shape of the resources it serves.
	 */
	endpoints: Endpoints

	/**
	 * The prefixes abbreviating the IRIs of the model.
	 */
	lexicon: Lexicon

	/**
	 * The shape to be located.
	 */
	shape: ResourceShape

}) {

	const groups: readonly { label: string, entries: readonly TOCEntry[] }[] = [

		{
			label: "Endpoint", entries: getShapeEndpoints(endpoints, shape).map(route => ({
				label: <span class={"tile-api-code"}>{route}</span>,
				href: `./#${getEndpointAnchor(route)}`
			}))
		},
		{
			label: "Classes", entries: opt(eager(shape).class, type => [{
				label: <span class={"tile-api-code"}>{prefixed(lexicon, type)}</span>,
				href: type
			}]) ?? []
		},
		{
			label: "Checks", entries: getShapeChecks(shape).map(check => ({
				label: <span class={"tile-api-code"}>{check}</span>
			}))
		},
		...[
			{ label: "Extends", links: getShapeParents(endpoints, lexicon, shape) },
			{ label: "Extended By", links: getShapeExtenders(endpoints, lexicon, shape) },
			{ label: "Referenced By", links: getShapeReferrers(endpoints, lexicon, shape) }
		].map(({ label, links }) => ({ label, entries: links.map(({ name, href }) => ({ label: name, href })) }))

	];

	return <TOC name={"Model"} entries={groups.filter(({ entries }) => entries.length > 0)}/>;

}
