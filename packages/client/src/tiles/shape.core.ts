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

import { Datasets } from "@ec2u/data-shared";
import { Courses } from "@ec2u/data-shared/courses/index.js";
import { Documents } from "@ec2u/data-shared/documents/index.js";
import { Events } from "@ec2u/data-shared/events/index.js";
import { Programs } from "@ec2u/data-shared/programs/index.js";
import { Taxonomies } from "@ec2u/data-shared/taxonomies/index.js";
import { Units } from "@ec2u/data-shared/units/index.js";
import { Universities } from "@ec2u/data-shared/universities/index.js";
import { lexicon } from "@ec2u/data-shared/vocabularies/index.js";
import { model } from "@metreeca/blue";
import type { Property, ResourceShape } from "@metreeca/blue/resource";
import { eager, type Shape } from "@metreeca/blue/value";
import { isString, type Lazy, opt, type Optional } from "@metreeca/core";
import type { Some } from "@metreeca/core/arrays";
import { compact } from "@metreeca/core/resource";
import { dedent } from "@metreeca/core/strings";


/**
 * The entry shapes of the model the hub serves: the catalogue of each dataset, from which every other documented shape
 * of the model is reached through the shapes they extend and the properties they declare.
 */
export const universe: Some<Lazy<ResourceShape>> = [
	Datasets,
	Universities,
	Units,
	Programs,
	Courses,
	Documents,
	Events,
	Taxonomies
];

/**
 * The base name of shapes stating neither a name nor a class.
 */
const anonymous = "Shape";

/**
 * The unique name and identifier of each shape reachable from {@link universe}, as listed by its
 * {@link @metreeca/blue!model model}, computed once, as shapes keep their identity for the lifetime of the page.
 */
const identities: ReadonlyMap<ResourceShape, Identity> = identify(model(universe));


/**
 * The documentation table of a resource shape.
 */
export type ShapeTable = {

	/**
	 * The {@link getShapeName | name} of the shape.
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
	 * The properties the shape declares in its own right or inherits from shapes outside the model, in declaration
	 * order, leaving out hidden ones and the ones its nearest documented ancestors declare, even where narrowed.
	 */
	readonly rows: readonly ShapeRow[]

	/**
	 * The properties the shape inherits from its documented ancestors, grouped by the ancestor declaring them, from the
	 * nearest to the most general; each property is listed once, as narrowed by the shape.
	 */
	readonly inherited: readonly ShapeGroup[]

};

/**
 * The documentation of the properties a resource shape inherits from one of its documented ancestors.
 */
export type ShapeGroup = {

	/**
	 * The ancestor documenting the properties, linked to its documentation.
	 */
	readonly parent: ShapeLink

	/**
	 * The inherited properties the ancestor documents, in its declaration order.
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
	 * The name of the type: the {@link getShapeName | name} of a shape, as `Schema Organization`, or else the name of
	 * the type of plain values, as `text` for localised text or the local name of a datatype such as `dateTime`.
	 */
	readonly name: string

	/**
	 * The location of the documentation of the type, relative to the models section, as returned by
	 * {@link getShapeHref}; none if the type is not a shape or its documentation is not located.
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
		parents: shape.parents.map(linked),

		rows: declared(shape).map(([term, property]) => row(term, property)),

		inherited: ancestry(shape)
			.map((ancestor, index, ancestors) => group(shape, ancestor, ancestors.slice(0, index)))
			.filter(({ rows }) => rows.length > 0)

	};

}

/**
 * Lists the documented ancestors of a shape, from the nearest to the most general, each listed once.
 */
function ancestry(shape: ResourceShape): readonly ResourceShape[] {

	const nearest = documented(shape);

	return [...nearest, ...nearest.flatMap(ancestry)].filter((ancestor, index, ancestors) =>
		ancestors.indexOf(ancestor) === index
	);

}

/**
 * Groups the properties a shape inherits from a documented ancestor, as narrowed by the shape, leaving out the ones
 * already grouped under nearer ancestors, so that each inherited property is listed once.
 */
function group(shape: ResourceShape, ancestor: ResourceShape, nearer: readonly ResourceShape[]): ShapeGroup {

	const grouped = nearer.flatMap(declared).map(([term]) => term);

	return {

		parent: linked(ancestor),

		rows: declared(ancestor).flatMap(([term]) => {

			const member = shape.members[term];

			return !grouped.includes(term) && member?.kind === "property" && !member.hidden ? [row(term, member)] : [];

		})

	};

}

/**
 * Lists the visible properties a shape documents: the ones it declares in its own right or inherits from shapes
 * outside the model, which have no documentation of their own, leaving out the ones its documented ancestors declare.
 */
function declared(shape: ResourceShape): readonly (readonly [string, Property])[] {

	const ancestors = documented(shape);

	return Object.entries(shape.members).flatMap(([term, member]) =>
		member.kind === "property" && !member.hidden && !ancestors.some(({ members }) => term in members)
			? [[term, member] as const]
			: []
	);

}

/**
 * Lists the nearest documented ancestors of a shape, looking through the shapes outside the model it extends.
 */
function documented(shape: ResourceShape): readonly ResourceShape[] {
	return shape.parents.flatMap(lazy => {

		const parent = eager(lazy);

		return identities.has(parent) ? [parent] : documented(parent);

	});
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
 * Every shape of the model reachable from {@link universe}, as listed by {@link @metreeca/blue!model model}, is named
 * uniquely within the model: by the English name it states in its own right, or else by the local name of the class
 * it states, as `Schema Organization`; a shape stating neither is named `Shape (n)`, and shapes whose names would
 * share an {@link getShapeId | identifier} are named `Name (n)`, numbered from 1 in model order.
 *
 * @param lazy The shape to be named, possibly deferred
 *
 * @returns The unique name of `lazy` within the model; for a shape outside the model, the English name it states,
 *     the local name of its class if it states no English name, or else `Shape` if it states neither of them
 */
export function getShapeName(lazy: Lazy<ResourceShape>): string {

	const shape = eager(lazy);

	return identities.get(shape)?.name ?? stated(shape) ?? anonymous;

}

/**
 * Identifies a resource shape.
 *
 * The identifier names the page documenting the shape in the models section and stays the same while the model is
 * unchanged; numbered identifiers may shift when shapes are added to or removed from the model.
 *
 * @param lazy The shape to be identified, possibly deferred
 *
 * @returns The identifier of `lazy`: its unique {@link getShapeName | name} as a lowercase kebab-case slug stripped of
 *     diacritics and punctuation, as `schema-organization` or `shape-3`; none if `lazy` is outside the model
 */
export function getShapeId(lazy: Lazy<ResourceShape>): Optional<string> {
	return identities.get(eager(lazy))?.id;
}

/**
 * Lists the shapes referring to a resource shape.
 *
 * Scans the shapes reachable from `universe`, as collected by {@link @metreeca/blue!model model}, for the ones
 * declaring in their own right a visible property whose values link to or embed `lazy`, leaving out `lazy` itself.
 * Shapes are matched by identity, so a property ranging over a refinement of `lazy` refers to the refinement alone.
 *
 * @param lazy The shape to be referred to, possibly deferred
 * @param universe The entry shapes of the model to be scanned, possibly deferred
 *
 * @returns The referring shapes in model order, each listed once and linked to its documentation; empty if no other
 *     shape refers to `lazy`
 */
export function getShapeReferrers(lazy: Lazy<ResourceShape>, universe: Some<Lazy<ResourceShape>>): readonly ShapeLink[] {

	const target = eager(lazy);

	return others(target, model(universe)
		.filter(shape => declared(shape).some(([, { range }]) =>
			targets(range.shape).includes(target)
		))
	);

}

/**
 * Lists the shapes a resource shape refers to.
 *
 * Collects the shapes linked or embedded by the visible properties `lazy` declares or inherits, matched by identity.
 *
 * @param lazy The shape whose references are to be listed, possibly deferred
 *
 * @returns The referenced shapes in alphabetical order, each listed once and linked to its documentation, leaving out
 *     `lazy` itself; empty if no property of `lazy` refers to another shape
 */
export function getShapeReferences(lazy: Lazy<ResourceShape>): readonly ShapeLink[] {

	const target = eager(lazy);

	return [...others(target, Object.values(target.members).flatMap(member =>
		member.kind === "property" && !member.hidden ? targets(member.range.shape) : []
	))].sort((x, y) => x.name.localeCompare(y.name, "en", { sensitivity: "base" })); // fresh array from spread

}

/**
 * Lists the shapes extending a resource shape.
 *
 * Scans the shapes reachable from `universe`, as collected by {@link @metreeca/blue!model model}, for the ones
 * extending `lazy` directly, matched by identity; the shapes extending them in turn are listed on their own pages.
 *
 * @param lazy The shape to be extended, possibly deferred
 * @param universe The entry shapes of the model to be scanned, possibly deferred
 *
 * @returns The extending shapes in model order, each listed once and linked to its documentation; empty if no other
 *     shape extends `lazy`
 */
export function getShapeExtenders(lazy: Lazy<ResourceShape>, universe: Some<Lazy<ResourceShape>>): readonly ShapeLink[] {

	const target = eager(lazy);

	return others(target, model(universe)
		.filter(shape => shape.parents.some(parent =>
			eager(parent) === target
		))
	);

}

/**
 * Lists the parents of a resource shape.
 *
 * Collects the shapes `lazy` extends directly, unnamed mixins included, each linked to its page.
 *
 * @param lazy The shape whose parents are to be listed, possibly deferred
 *
 * @returns The parents of `lazy` in declaration order, each listed once; empty if `lazy` extends no other shape
 */
export function getShapeParents(lazy: Lazy<ResourceShape>): readonly ShapeLink[] {

	const target = eager(lazy);

	return others(target, target.parents.map(parent => eager(parent)));

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
 * Locates the documentation of a resource shape.
 *
 * A shape is documented on a page of its own in the models section, named after its {@link getShapeId | identifier}.
 * The location is relative to the section, so it resolves as is from any page of the section and must be prefixed by
 * the route of the section when linked from a page elsewhere, as the dataset pages do.
 *
 * @param lazy The shape to be located, possibly deferred
 *
 * @returns The location of the documentation of `lazy` relative to the models section, as `schema-organization`; none
 *     if `lazy` is outside the model reachable from {@link universe}, and so has no page of its own
 */
export function getShapeHref(lazy: Lazy<ResourceShape>): Optional<string> {
	return getShapeId(lazy);
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
 * Abbreviates an IRI of the data model as a prefixed name.
 *
 * @param iri The IRI to be abbreviated
 *
 * @returns The prefixed name of `iri` under the shared {@link lexicon}, as `ec2u:Course` for
 *     `https://data.ec2u.eu/terms#Course`; the whole `iri`, left unabbreviated, where no prefix of the lexicon applies
 */
export function prefixed(iri: string): string {
	return compact(lexicon, iri) ?? iri;
}

/**
 * Retrieves the local name of an IRI, following its last `#` or `/`.
 */
function local(iri: string): string {
	return iri.replace(/^.*[#/]/, "");
}


/**
 * The unique name and identifier of a shape within the model.
 */
type Identity = {

	readonly name: string
	readonly id: string

};

/**
 * Names and identifies each shape of a model uniquely, numbering from 1 in model order the anonymous shapes and the
 * shapes whose names would otherwise share an identifier, so that no two shapes share a page.
 */
function identify(shapes: readonly ResourceShape[]): ReadonlyMap<ResourceShape, Identity> {

	const bases = shapes.map(shape => ({ shape, base: stated(shape) }));

	return new Map(bases.map(({ shape, base }) => {

		const label = base ?? anonymous;
		const peers = bases.filter(peer => slug(peer.base ?? anonymous) === slug(label)).map(peer => peer.shape);
		const name = base !== undefined && peers.length === 1 ? label : `${label} (${peers.indexOf(shape) + 1})`;

		return [shape, { name, id: slug(name) }];

	}));

}

/**
 * Retrieves the name a shape states in its own right: its English name, or else the local name of its class.
 */
function stated(shape: ResourceShape): Optional<string> {
	return english(shape.name) ?? opt(shape.class, local);
}

/**
 * Converts a name into a lowercase kebab-case slug, stripped of diacritics and punctuation.
 */
function slug(name: string): string {
	return name
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}
