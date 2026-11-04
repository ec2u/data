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

import { model } from "@metreeca/blue";
import type { Property, ResourceShape } from "@metreeca/blue/resource";
import { eager, type Shape } from "@metreeca/blue/value";
import { isString, type Lazy, opt, type Optional } from "@metreeca/core";
import type { Some } from "@metreeca/core/arrays";


/**
 * The documentation table of a resource shape.
 */
export type ShapeTable = {

	/**
	 * The name of the shape, as stated in English; the class local name if the shape states no English name.
	 */
	readonly name: string

	/**
	 * The IRI of the class the shape states; none if the shape states no class.
	 */
	readonly class: Optional<string>

	/**
	 * The root-relative address of the resources the shape describes, as stated by its identifier pattern, such as
	 * `/universities/{code}`; none if the shape states no pattern.
	 */
	readonly endpoint: Optional<string>

	/**
	 * The named shapes the shape extends, in the order they are extended.
	 */
	readonly parents: readonly ShapeLink[]

	/**
	 * The properties the shape declares in its own right, in declaration order, leaving out hidden ones and the ones the
	 * shapes it extends declare, even where the shape narrows them.
	 */
	readonly rows: readonly ShapeRow[]

};

/**
 * The documentation row of a property declared by a resource shape.
 */
export type ShapeRow = {

	/**
	 * The name the property is keyed by in resource states.
	 */
	readonly term: string

	/**
	 * The IRI of the predicate the property maps to; none if the property states no predicate.
	 */
	readonly predicate: Optional<string>

	/**
	 * The types of the property values, one for each alternative the property admits: the shape of linked or embedded
	 * resources, `text` for localised text, the local name of the datatype of plain values, or the value kind where no
	 * datatype is stated; only shapes are linked to their documentation.
	 */
	readonly types: readonly ShapeLink[]

	/**
	 * The number of values the property admits: `1`, `0..1`, `*`, `1..*`, or `min..max` for other bounds, with an
	 * open upper bound stated as `*`.
	 */
	readonly cardinality: string

	/**
	 * The description of the property, as stated in English, with its whitespace collapsed; none if not stated in
	 * English.
	 */
	readonly description: Optional<string>

};

/**
 * A named reference to a type, linked to its documentation where known.
 */
export type ShapeLink = {

	/**
	 * The name of the type.
	 */
	readonly name: string

	/**
	 * The root-relative location of the documentation of the type, as returned by {@link getShapeHref}; none if the
	 * type is not a shape or its documentation is not located.
	 */
	readonly href: Optional<string>

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Tabulates a resource shape for documentation.
 *
 * @param lazy The shape to be tabulated, possibly deferred
 *
 * @returns The table of the properties `lazy` declares
 */
export function tabulate(lazy: Lazy<ResourceShape>): ShapeTable {

	const shape = eager(lazy);

	return {

		name: getShapeName(shape),
		class: shape.class,
		endpoint: opt(shape.pattern, pattern => pattern.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, "")),
		parents: shape.parents.map(linked).filter(({ name }) => name !== ""), // unnamed mixins add no documented type

		rows: declared(shape).map(([term, property]) => row(term, property))

	};

}

/**
 * Lists the visible properties a shape declares in its own right, leaving out the ones the shapes it extends declare.
 */
function declared(shape: ResourceShape): readonly (readonly [string, Property])[] {

	const parents = shape.parents.map(parent => eager(parent));

	return Object.entries(shape.members).flatMap(([term, member]) =>
		member.kind === "property" && !member.hidden && !parents.some(({ members }) => term in members)
			? [[term, member] as const]
			: []
	);

}

/**
 * Tabulates a property.
 */
function row(term: string, { forward, reverse, range, description }: Property): ShapeRow {
	return {

		term,
		predicate: forward ?? reverse,
		types: typed(range.shape),
		cardinality: bounded(range.minCount, range.maxCount),
		description: english(description)

	};
}


/**
 * Names a resource shape.
 *
 * @param lazy The shape to be named, possibly deferred
 *
 * @returns The English name `lazy` states, the local name of its class if it states no English name, or else the name
 *     of its nearest named ancestor, searched depth-first in the order the shapes are extended; empty if none is named
 */
export function getShapeName(lazy: Lazy<ResourceShape>): string {

	const shape = eager(lazy);

	return english(shape.name) ?? opt(shape.class, local) ?? (shape.parents.map(getShapeName).find(Boolean) ?? "");

}

/**
 * Lists the properties referring to a resource shape.
 *
 * Scans the shapes reachable from `universe`, as collected by {@link @metreeca/blue!model model}, for the properties
 * they declare in their own right whose values link to or embed `lazy`, leaving out hidden ones.
 *
 * @param lazy The shape to be referred to, possibly deferred
 * @param universe The entry shapes of the model to be scanned, possibly deferred
 *
 * @returns The referring properties in model order, each named as `Shape.property` and linked to the documentation of
 *     the shape declaring it; empty if no property refers to `lazy`
 */
export function getShapeReferrers(lazy: Lazy<ResourceShape>, universe: Some<Lazy<ResourceShape>>): readonly ShapeLink[] {

	const target = eager(lazy);

	return model(universe).flatMap(shape => declared(shape)
		.filter(([, { range }]) => targets(range.shape).includes(target))
		.map(([term]) => ({ name: `${getShapeName(shape)}.${term}`, href: getShapeHref(shape) }))
	);

}

/**
 * Lists the resource shapes the values of a shape link to or embed, one for each alternative.
 */
function targets(lazy: Lazy<Shape>): readonly ResourceShape[] {

	const shape = eager(lazy);

	return shape.kind === "union" ? shape.branches.flatMap(targets)
		: shape.kind === "reference" ? [eager(shape.target)]
			: shape.kind === "resource" ? [shape]
				: [];

}

/**
 * Describes a resource shape.
 *
 * @param lazy The shape to be described, possibly deferred
 *
 * @returns The English description `lazy` states, with its whitespace collapsed; none if it states none in English
 */
export function getShapeDescription(lazy: Lazy<ResourceShape>): Optional<string> {
	return english(eager(lazy).description);
}

/**
 * Locates the documentation of a resource shape.
 *
 * A shape is documented on the introduction page of the catalogue serving its resources, under a heading named
 * after the shape: the catalogue is the first path segment of the identifier pattern the shape states, or the root
 * catalogue if the pattern states no path segment.
 *
 * @param lazy The shape to be located, possibly deferred
 *
 * @returns The root-relative location of the documentation of `lazy`, as `/about/datasets/universities#University`;
 *     none if `lazy` states no identifier pattern
 */
export function getShapeHref(lazy: Lazy<ResourceShape>): Optional<string> {

	const shape = eager(lazy);

	return opt(shape.pattern, pattern => {

		const [segment] = new URL(pattern, "https://example.org/").pathname.split("/").filter(Boolean);
		const catalogue = segment === undefined || /^(%7B|\*)/i.test(segment) ? "" : `/${segment}`;

		return `/about/datasets${catalogue}#${encodeURIComponent(getShapeName(shape))}`;

	});

}

/**
 * Links a resource shape to its documentation.
 */
function linked(lazy: Lazy<ResourceShape>): ShapeLink {
	return { name: getShapeName(lazy), href: getShapeHref(lazy) };
}

/**
 * Lists the types of the values a shape admits, one for each alternative.
 */
function typed(lazy: Lazy<Shape>): readonly ShapeLink[] {

	const shape = eager(lazy);

	return shape.kind === "union" ? shape.branches.flatMap(typed)
		: shape.kind === "reference" ? [linked(shape.target)]
			: shape.kind === "resource" ? [linked(shape)]
				: [{ name: plain(shape), href: undefined }];

}

/**
 * Names the type of plain values.
 */
function plain(shape: Exclude<Shape, { readonly kind: "union" | "reference" | "resource" }>): string {
	return shape.kind === "dictionary" ? "text"
		: shape.kind === "boolean" ? "boolean"
			: opt(shape.datatype, local) ?? shape.kind;
}

/**
 * States the number of values a range admits.
 */
function bounded(min: Optional<number>, max: Optional<number>): string {

	const lower = min ?? 0;

	return lower === 1 && max === 1 ? "1"
		: lower === 0 && max === 1 ? "0..1"
			: lower === 0 && max === undefined ? "*"
				: `${lower}..${max ?? "*"}`;

}


/**
 * Retrieves the English text of a label, with its whitespace collapsed.
 */
function english(text: ResourceShape["name"]): Optional<string> {

	const value = isString(text) ? text : text?.en;

	return isString(value) ? value.trim().replace(/\s+/g, " ") : undefined;

}

/**
 * Retrieves the local name of an IRI, following its last `#` or `/`.
 */
function local(iri: string): string {
	return iri.replace(/^.*[#/]/, "");
}
