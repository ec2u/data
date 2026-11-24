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
import type { Lazy } from "@grafctory/core";
import type { Lexicon } from "@grafctory/core/resource";
import type { Endpoints } from "./endpoints.core.js";
import { described, type ShapeMember } from "./index.core.js";
import { declared, documented, linked, type ShapeLink, shown } from "./shapes.core.js";


/**
 * The documentation table of a resource shape.
 */
export type ShapeTable = {

	/**
	 * The members the shape declares in its own right, labels or describes in its own terms, or inherits from shapes
	 * outside the model, in declaration order, leaving out hidden ones and the ones its nearest documented ancestors
	 * declare with the same name and description, even where their range is narrowed.
	 */
	readonly rows: readonly ShapeMember[]

	/**
	 * The members the shape inherits from its documented ancestors, grouped by the ancestor declaring them, from the
	 * nearest to the most general; each member is listed once, as narrowed by the shape.
	 */
	readonly inherited: readonly ShapeGroup[]
};

/**
 * The documentation of the members a resource shape inherits from one of its documented ancestors.
 */
export type ShapeGroup = {

	/**
	 * The ancestor documenting the members, linked to its documentation.
	 */
	readonly parent: ShapeLink

	/**
	 * The inherited members the ancestor documents, in its declaration order.
	 */
	readonly rows: readonly ShapeMember[]

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Tabulates a resource shape for documentation.
 *
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 * @param lexicon The prefixes abbreviating the IRIs of the model
 * @param lazy The shape to be tabulated, possibly deferred
 *
 * @returns The table of the members `lazy` declares or inherits
 */
export function getShapeTable(endpoints: Endpoints, lexicon: Lexicon, lazy: Lazy<ResourceShape>): ShapeTable {

	const shape = eager(lazy);

	return {

		rows: declared(endpoints, lexicon, shape).map(([term, member]) => described(endpoints, lexicon, shape, term, member)),

		inherited: ancestry(endpoints, lexicon, shape)
			.map((ancestor, index, ancestors) => group(endpoints, lexicon, shape, ancestor, ancestors.slice(0, index)))
			.filter(({ rows }) => rows.length > 0)

	};

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Lists the documented ancestors of a shape, from the nearest to the most general, each listed once.
 */
function ancestry(endpoints: Endpoints, lexicon: Lexicon, shape: ResourceShape): readonly ResourceShape[] {

	const nearest = documented(endpoints, lexicon, shape);

	return [...nearest, ...nearest.flatMap(ancestor => ancestry(endpoints, lexicon, ancestor))].filter((ancestor, index, ancestors) =>
		ancestors.indexOf(ancestor) === index
	);

}

/**
 * Groups the members a shape inherits from a documented ancestor, as narrowed by the shape, leaving out the ones
 * the shape documents in its own terms or already grouped under nearer ancestors, so that each is listed once.
 */
function group(
	endpoints: Endpoints, lexicon: Lexicon,
	shape: ResourceShape,
	ancestor: ResourceShape,
	nearer: readonly ResourceShape[]
): ShapeGroup {

	const grouped = [shape, ...nearer].flatMap(peer => declared(endpoints, lexicon, peer)).map(([term]) => term);

	return {

		parent: linked(endpoints, lexicon, ancestor),

		rows: declared(endpoints, lexicon, ancestor).flatMap(([term]) => {

			const member = shown(shape, term);

			return !grouped.includes(term) && member !== undefined ? [described(endpoints, lexicon, shape, term, member)] : [];

		})

	};

}
