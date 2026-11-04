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
import { dedent } from "@metreeca/core/strings";
import { ec2u, rdfs } from "@ec2u/data-shared";
import { dcat } from "@ec2u/data-shared/vocabularies/dcat.js";
import { dct } from "@ec2u/data-shared/vocabularies/dct.js";
import { foaf } from "@ec2u/data-shared/vocabularies/foaf.js";
import { org } from "@ec2u/data-shared/vocabularies/org.js";
import { schema } from "@ec2u/data-shared/vocabularies/schema/index.js";
import { skos } from "@ec2u/data-shared/vocabularies/skos.js";
import { getNamespaceIRI } from "@metreeca/core/resource";
import { wgs } from "@metreeca/work/open/wgs.js";


/**
 * The prefixes abbreviating the namespaces of the data model, as used in its documentation.
 */
const prefixes: Readonly<Record<string, string>> = {
	ec2u: getNamespaceIRI(ec2u),
	rdfs: getNamespaceIRI(rdfs),
	dcat: getNamespaceIRI(dcat),
	dct: getNamespaceIRI(dct),
	foaf: getNamespaceIRI(foaf),
	org: getNamespaceIRI(org),
	schema: getNamespaceIRI(schema),
	skos: getNamespaceIRI(skos),
	geo: getNamespaceIRI(wgs)
};


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
	 * The description of the property, as English markdown realigned to the left margin; none if not stated in
	 * English.
	 */
	readonly description: Optional<string>

};

/**
 * A named reference to a type, linked to its documentation where known.
 */
export type ShapeLink = {

	/**
	 * The name of the type: the {@link getShapeKey | key} of a keyed shape, as `schema:Organization`, or else its name.
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
		description: markup(description)

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
 * Lists the shapes referring to a resource shape.
 *
 * Scans the shapes reachable from `universe`, as collected by {@link @metreeca/blue!model model}, for the ones
 * declaring in their own right a visible property whose values link to or embed `lazy`, leaving out `lazy` itself.
 * Shapes are matched by {@link getShapeKey | key}, a value shape stating none taking the keys of its nearest keyed
 * ancestors, so that a property ranging over an unkeyed refinement of `lazy` still refers to it; an unkeyed `lazy`
 * is matched by identity.
 *
 * @param lazy The shape to be referred to, possibly deferred
 * @param universe The entry shapes of the model to be scanned, possibly deferred
 *
 * @returns The referring shapes in model order, each listed once and linked to its documentation; empty if no other
 *     shape refers to `lazy`
 */
export function getShapeReferrers(lazy: Lazy<ResourceShape>, universe: Some<Lazy<ResourceShape>>): readonly ShapeLink[] {

	const target = eager(lazy);
	const key = getShapeKey(target);

	return others(target, model(universe)
		.filter(shape => declared(shape).some(([, { range }]) => targets(range.shape).some(value =>
			key === undefined ? value === target : keys(value).includes(key)
		)))
	);

}

/**
 * Lists the shapes extending a resource shape.
 *
 * Scans the shapes reachable from `universe`, as collected by {@link @metreeca/blue!model model}, for the ones
 * extending `lazy` directly or through shapes stating no {@link getShapeKey | key}, matched as by
 * {@link getShapeReferrers}; an unkeyed refinement of `lazy` is not listed, as it shares its documentation.
 *
 * @param lazy The shape to be extended, possibly deferred
 * @param universe The entry shapes of the model to be scanned, possibly deferred
 *
 * @returns The extending shapes in model order, each listed once and linked to its documentation; empty if no other
 *     shape extends `lazy`
 */
export function getShapeExtenders(lazy: Lazy<ResourceShape>, universe: Some<Lazy<ResourceShape>>): readonly ShapeLink[] {

	const target = eager(lazy);
	const key = getShapeKey(target);

	return others(target, model(universe)
		.filter(shape => shape.parents.some(parent =>
			key === undefined ? eager(parent) === target : keys(eager(parent)).includes(key)
		))
	);

}

/**
 * Lists the lineage of a resource shape.
 *
 * Collects every shape `lazy` extends, directly or transitively, linking each to its documentation, an unkeyed one to
 * the documentation of its nearest keyed ancestor; unnamed mixins are left out.
 *
 * @param lazy The shape whose ancestors are to be listed, possibly deferred
 *
 * @returns The ancestors of `lazy`, nearest first, each listed once; empty if `lazy` extends no named shape
 */
export function getShapeAncestors(lazy: Lazy<ResourceShape>): readonly ShapeLink[] {

	const target = eager(lazy);

	return others(target, lineage(target)).filter(({ name }) => name !== "");


	function lineage(shape: ResourceShape): readonly ResourceShape[] {

		const parents = shape.parents.map(parent => eager(parent));

		return [...parents, ...parents.flatMap(lineage)];

	}

}

/**
 * Links a list of shapes to their documentation, leaving out the ones sharing the documentation of a target shape and
 * listing each documentation once.
 */
function others(target: ResourceShape, shapes: readonly ResourceShape[]): readonly ShapeLink[] {

	const self = linked(target);

	return shapes
		.map(linked)
		.filter(({ name, href }) => href === undefined ? name !== self.name : href !== self.href)
		.filter(({ name, href }, index, links) => links.findIndex(link =>
			link.href === href && link.name === name
		) === index);

}

/**
 * Lists the keys a shape is matched by: its own, or else the ones of its nearest keyed ancestors.
 */
function keys(shape: ResourceShape): readonly string[] {
	return opt(getShapeKey(shape), key => [key]) ?? shape.parents.flatMap(parent => keys(eager(parent)));
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
 * @returns The English description `lazy` states, as markdown realigned to the left margin; none if it states none in
 *     English
 */
export function getShapeDescription(lazy: Lazy<ResourceShape>): Optional<string> {
	return markup(eager(lazy).description);
}

/**
 * Summarises a resource shape.
 *
 * Following the TSDoc convention, the summary is the first paragraph of the {@link getShapeDescription | description}.
 *
 * @param lazy The shape to be summarised, possibly deferred
 *
 * @returns The first paragraph of the English description `lazy` states, with its whitespace collapsed; none if it
 *     states none in English
 */
export function getShapeSummary(lazy: Lazy<ResourceShape>): Optional<string> {
	return opt(getShapeDescription(lazy), summarize);
}

/**
 * Keys a resource shape.
 *
 * The key identifies the shape within the model, stays the same across releases, and names the page documenting the
 * shape under `/models/`, so it may be bookmarked and linked to.
 *
 * @param lazy The shape to be keyed, possibly deferred
 *
 * @returns The key of `lazy`: the prefixed name of the class it states in its own right, as `schema:Organization`, or
 *     else the English name it states in its own right, as `Universities`; none if it states neither
 */
export function getShapeKey(lazy: Lazy<ResourceShape>): Optional<string> {

	// !!! stub: keyed by class or name pending a stable and robust shape identity

	const shape = eager(lazy);

	return opt(shape.class, prefixed) ?? english(shape.name);

}

/**
 * Locates the documentation of a resource shape.
 *
 * A shape is documented on a page of its own under `/models/`, named after its {@link getShapeKey | key}.
 *
 * @param lazy The shape to be located, possibly deferred
 *
 * @returns The root-relative location of the documentation of `lazy`, as `/models/schema:Organization`; none if
 *     `lazy` is not keyed
 */
export function getShapeHref(lazy: Lazy<ResourceShape>): Optional<string> {
	return opt(getShapeKey(lazy), located);
}

/**
 * Locates the documentation of the shape with a key.
 */
function located(key: string): string {
	return `/models/${encodeURIComponent(key).replace(/%3A/g, ":")}`;
}

/**
 * Links a resource shape to its documentation, an unkeyed shape to the one of its nearest keyed ancestor.
 */
function linked(lazy: Lazy<ResourceShape>): ShapeLink {

	const key = keys(eager(lazy)).at(0);

	return { name: key ?? getShapeName(lazy), href: opt(key, located) };

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
	return opt(markup(text), collapse);
}

/**
 * Retrieves the English markdown of a description, realigned to the left margin.
 */
function markup(text: ResourceShape["description"]): Optional<string> {

	const value = isString(text) ? text : text?.en;

	return isString(value) ? dedent(value) : undefined;

}

/**
 * Extracts the summary of a markdown description: its first paragraph, with whitespace collapsed.
 */
function summarize(markdown: string): string {
	return collapse(markdown.split(/\n\s*\n/)[0] ?? "");
}

/**
 * Collapses runs of whitespace into single spaces, trimming the ends.
 */
function collapse(text: string): string {
	return text.trim().replace(/\s+/g, " ");
}

/**
 * Abbreviates an IRI as a prefixed name, falling back to the whole IRI where no known namespace includes it.
 */
function prefixed(iri: string): string {
	return Object.entries(prefixes)
		.flatMap(([prefix, namespace]) => iri.startsWith(namespace) ? [`${prefix}:${iri.slice(namespace.length)}`] : [])
		.at(0) ?? iri;
}

/**
 * Retrieves the local name of an IRI, following its last `#` or `/`.
 */
function local(iri: string): string {
	return iri.replace(/^.*[#/]/, "");
}
