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

import { model } from "@metreeca/blue";
import type { Member, Members, ResourceShape } from "@metreeca/blue/resource";
import { eager, type Shape } from "@metreeca/blue/value";
import { error, isString, type Lazy, opt, type Optional } from "@metreeca/core";
import type { Tag } from "@metreeca/core/language";
import { by, locale } from "@metreeca/core/order";
import { compact, type Lexicon } from "@metreeca/core/resource";
import { dedent, summary } from "@metreeca/core/strings";
import { equals } from "@metreeca/core/values";
import { type Endpoints, getContainers } from "./endpoints.core.js";


/**
 * The catalogue of each pair of routes and lexicon documented so far, computed once for the lifetime of the pair.
 */
const catalogues = new WeakMap<Endpoints, WeakMap<Lexicon, Catalogue>>();


/**
 * A named reference to a type, linked to its documentation where known.
 */
export type ShapeLink = {

	/**
	 * The name of the type: the {@link nameShape | name} of a shape, as `Schema Organization`, or else the name of
	 * the type of plain values, as `Dictionary` for localised text or the local name of a datatype such as `dateTime`.
	 */
	readonly name: string

	/**
	 * The location of the documentation of the type, relative to the models section: the {@link getShapeId |
	 * identifier} of a shape; none if the type is not a shape or its documentation is not located.
	 */
	readonly href: Optional<string>

};


/**
 * A documented shape of the data model, at its place in a listing of the model.
 */
export type Model = {

	/**
	 * The location of the page documenting the shape: its {@link getShapeId | identifier}, relative to the models
	 * section.
	 */
	readonly href: string

	/**
	 * The documented shape.
	 */
	readonly shape: ResourceShape

	/**
	 * The number of ancestors above the shape in the listing.
	 */
	readonly depth: number

	/**
	 * The path leading to the shape from its root, identifying a shape listed under several parents once each.
	 */
	readonly path: string

};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Retrieves a shape of the model by its identifier.
 *
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 * @param lexicon The prefixes abbreviating the IRIs of the model
 * @param id The {@link getShapeId | identifier} of the shape to be retrieved
 *
 * @returns The shape of the model identified by `id`; none if no shape is identified by `id`
 */
export function getShape(endpoints: Endpoints, lexicon: Lexicon, id: string): Optional<ResourceShape> {
	return [...catalogue(endpoints, lexicon).identities].find(([, identity]) => identity === id)?.[0];
}

/**
 * Identifies a resource shape.
 *
 * The identifier names the page documenting the shape in the models section, as a lowercase kebab-case slug. Classed
 * shapes are identified by the prefixed name of their class under `lexicon`, as `ex-item`, which stays the same while
 * the class does. Class-less shapes are identified, until stable identities are available for them, by their English
 * label, as `example-items`, or as `shape-n` if they state none; numbered identifiers may shift when shapes are added
 * to or removed from the model, breaking any link to their pages that readers have saved or shared.
 *
 * As a location, the identifier is relative to the models section: it resolves as is from any page of the section and
 * must be prefixed by the route of the section when linked from a page elsewhere.
 *
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 * @param lexicon The prefixes abbreviating the IRIs of the model
 * @param lazy The shape to be identified, possibly deferred
 *
 * @returns The identifier of `lazy`; none if `lazy` is outside the model or is an anonymous shape used at a single
 *     site, documented where it is used rather than on a page of its own
 *
 * @throws RangeError If two shapes of the model would share an identifier, as a class-less shape labelled `Ex Item`
 *     beside a shape of class `ex:Item`, so that no page of the models section ever documents the wrong shape
 */
export function getShapeId(endpoints: Endpoints, lexicon: Lexicon, lazy: Lazy<ResourceShape>): Optional<string> {
	return catalogue(endpoints, lexicon).identities.get(eager(lazy));
}

/**
 * Names the shape of the model carrying an identifier, for display.
 *
 * Names are meant for readers, as page titles, and may be shared by several shapes, which are told apart by their
 * identifier. A shape is named by its English label, else by the prefixed name of its class under `lexicon`, as
 * `schema:Organization`, else by the names of the shapes it extends.
 *
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 * @param lexicon The prefixes abbreviating the IRIs of the model
 * @param id The identifier of the shape, as the last step of the route of its documentation page
 *
 * @returns The display name of the shape identified by `id`; none if no shape of the model carries `id`
 */
export function getShapeName(endpoints: Endpoints, lexicon: Lexicon, id: string): Optional<string> {
	return opt(getShape(endpoints, lexicon, id), shape => nameShape(shape, lexicon));
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
 * Names the custom checks a resource shape states.
 *
 * @param lazy The shape whose checks are to be named, possibly deferred
 *
 * @returns The names of the custom checks the resources of `lazy` must pass beyond its declarative constraints, in
 *     declaration order, inherited ones included; a check stating no name is listed as `check`
 */
export function getShapeChecks(lazy: Lazy<ResourceShape>): readonly string[] {
	return (eager(lazy).validators ?? []).map(({ name }) => name !== "" ? name : "check");
}

/**
 * Lists the parents of a resource shape.
 *
 * Collects the shapes `lazy` extends directly, unnamed mixins included, each linked to its page.
 *
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 * @param lexicon The prefixes abbreviating the IRIs of the model
 * @param lazy The shape whose parents are to be listed, possibly deferred
 *
 * @returns The parents of `lazy` in declaration order, each listed once; empty if `lazy` extends no other shape
 */
export function getShapeParents(
	endpoints: Endpoints,
	lexicon: Lexicon,
	lazy: Lazy<ResourceShape>
): readonly ShapeLink[] {

	const target = eager(lazy);

	return others(endpoints, lexicon, target, target.parents.map(parent => eager(parent)));

}

/**
 * Lists the shapes extending a resource shape.
 *
 * Scans the shapes of the model for the ones extending `lazy` directly, matched by identity; the shapes extending
 * them in turn are listed on their own pages, so that each page states a single step of the inheritance hierarchy.
 *
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 * @param lexicon The prefixes abbreviating the IRIs of the model
 * @param lazy The shape to be extended, possibly deferred
 *
 * @returns The extending shapes in model order, each listed once and linked to its documentation; empty if no other
 *     shape extends `lazy`
 */
export function getShapeExtenders(
	endpoints: Endpoints,
	lexicon: Lexicon,
	lazy: Lazy<ResourceShape>
): readonly ShapeLink[] {

	const target = eager(lazy);

	return others(endpoints, lexicon, target, catalogue(endpoints, lexicon).shapes.filter(shape =>
		shape.parents.some(parent => eager(parent) === target)
	));

}

/**
 * Lists the shapes referring to a resource shape.
 *
 * Scans the shapes of the model for the ones declaring in their own right a visible property whose values link to or
 * embed `lazy`, leaving out `lazy` itself. Shapes are matched by identity, so a property ranging over a refinement of
 * `lazy` refers to the refinement alone and leaves the shape declaring it out of the list.
 *
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 * @param lexicon The prefixes abbreviating the IRIs of the model
 * @param lazy The shape to be referred to, possibly deferred
 *
 * @returns The referring shapes in model order, each listed once and linked to its documentation; empty if no other
 *     shape refers to `lazy`
 */
export function getShapeReferrers(
	endpoints: Endpoints,
	lexicon: Lexicon,
	lazy: Lazy<ResourceShape>
): readonly ShapeLink[] {

	const target = eager(lazy);

	return others(endpoints, lexicon, target, catalogue(endpoints, lexicon).shapes.filter(shape =>
		declared(endpoints, lexicon, shape).some(([, member]) =>
			member.kind === "property" && targets(member.range.shape).includes(target)
		)
	));

}

/**
 * Lists the nearest documented ancestors of a shape, looking through the shapes outside the model it extends.
 *
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 * @param lexicon The prefixes abbreviating the IRIs of the model
 * @param shape The shape whose ancestors are to be listed
 *
 * @returns The nearest shapes `shape` extends that have a page of their own, in declaration order
 */
export function documented(endpoints: Endpoints, lexicon: Lexicon, shape: ResourceShape): readonly ResourceShape[] {
	return shape.parents.flatMap(lazy => {

		const parent = eager(lazy);

		return catalogue(endpoints, lexicon).identities.has(parent) ? [parent] : documented(endpoints, lexicon, parent);

	});
}

/**
 * Lists the visible members a shape documents: the ones it declares in its own right or inherits from shapes outside
 * the model, which have no documentation of their own, and the properties it labels or describes in its own terms,
 * leaving out the ones its documented ancestors declare with the same name and description.
 */
export function declared(endpoints: Endpoints, lexicon: Lexicon, shape: ResourceShape): readonly Declared[] {

	const ancestors = documented(endpoints, lexicon, shape);

	return Object.keys(shape.members).flatMap(term => opt(shown(shape, term), (member): readonly Declared[] =>
		ancestors.every(ancestor => refines(member, shown(ancestor, term))) ? [[term, member]] : []
	) ?? []);

}

/**
 * Retrieves the member a shape shows under a name: none if hidden, or if it carries the class of the resource on a
 * shape stating no class, which admits no value for it.
 */
export function shown(shape: ResourceShape, term: string): Optional<Member> {

	const member = shape.members[term];

	return member === undefined || member.hidden || member.kind === "type" && shape.class === undefined
		? undefined
		: member;

}

/**
 * Links a resource shape to its documentation, or to the documentation of the shape it refines if it is an anonymous
 * shape documented where it is used.
 */
export function linked(endpoints: Endpoints, lexicon: Lexicon, lazy: Lazy<ResourceShape>): ShapeLink {

	const shape = eager(lazy);
	const [parent, ...rest] = shape.parents;

	const refined = inlined(endpoints, lexicon, shape) && parent !== undefined && rest.length === 0
		? linked(endpoints, lexicon, parent).href
		: undefined;

	return { name: nameShape(shape, lexicon), href: getShapeId(endpoints, lexicon, shape) ?? refined };

}

/**
 * Checks whether a shape is documented where it is used rather than on a page of its own: an anonymous shape, stating
 * neither a label nor a class, that the model leaves unidentified, as it is used at a single site of the model.
 */
export function inlined(endpoints: Endpoints, lexicon: Lexicon, shape: ResourceShape): boolean {
	return english(shape.name) === undefined
		&& shape.class === undefined
		&& getShapeId(endpoints, lexicon, shape) === undefined;
}

/**
 * Retrieves the English text of a label, with its whitespace collapsed.
 */
export function english(text: ResourceShape["name"]): Optional<string> {
	return opt(markup(text), collapse);
}

/**
 * Retrieves the English markdown of a description, realigned to the left margin.
 */
export function markup(text: ResourceShape["description"]): Optional<string> {

	const value = isString(text) ? text : text?.en;

	return isString(value) ? dedent(value) : undefined;

}

/**
 * Extracts the summary of a markdown description: its first paragraph, with whitespace collapsed.
 */
export function summarize(markdown: string): Optional<string> {
	return opt(summary(markdown), collapse);
}

/**
 * Abbreviates an IRI of the data model as a prefixed name.
 *
 * @param lexicon The prefixes abbreviating the IRIs of the model
 * @param iri The IRI to be abbreviated
 *
 * @returns The prefixed name of `iri` under the lexicon, as `ex:Item` for `https://example.org/terms#Item`;
 *     the whole `iri`, left unabbreviated, where no prefix of the lexicon applies
 */
export function prefixed(lexicon: Lexicon, iri: string): string {
	return compact(lexicon, iri) ?? iri;
}


/**
 * Identifies the classed shapes of a model.
 *
 * Each shape stating a class is identified by the prefixed name of its class under `lexicon` as a lowercase kebab-case
 * slug, as `ex-course` for `https://example.org/terms#Course` under the `ex` prefix, the same style class-less shapes
 * are identified in. The identifier is the same wherever a model is published, as a description key, an OpenAPI schema
 * name, a `$ref` target or the last step of a documentation route, and it stays the same while the class does, however
 * the shape is labelled or reached. Shapes stating no class are left unidentified, as no class gives them an identity.
 *
 * @param shapes The shapes of the model to be identified, possibly deferred
 * @param lexicon The prefixes the classes of the model are named under
 *
 * @returns The identifier of each shape of `shapes` stating a class; shapes stating no class are absent
 *
 * @throws RangeError If two shapes of `shapes` state classes whose prefixed names share a slug, as the same class,
 *     classes differing in case or punctuation alone, or `ex-a:B` and `ex:A-B`, or if `lexicon` has no prefix for
 *     the namespace of a class stated by a shape of `shapes`, as no prefixed name then exists to identify it by
 */
export function classify(
	shapes: readonly Lazy<ResourceShape>[],
	lexicon: Lexicon
): ReadonlyMap<ResourceShape, string> {

	const classed = [...new Set(shapes.map(eager))].flatMap(shape =>
		opt(shape.class, iri => [{ shape, iri, id: identifier(iri) }]) ?? []
	);

	const duplicate = classed.find(({ id }, index) => classed.findIndex(peer => peer.id === id) !== index);

	return duplicate !== undefined
		? error(new RangeError(`duplicated identifier <${duplicate.id}> of class <${duplicate.iri}>`))
		: new Map(classed.map(({ shape, id }) => [shape, id]));


	function identifier(iri: string): string {
		return opt(compact(lexicon, iri), slug)
			?? error(new RangeError(`unprefixed class <${iri}>`));
	}

}

/**
 * Names a resource shape for display.
 *
 * The name is meant for readers only and never for addressing a shape, as shapes are told apart by their identity
 * and two shapes may share a name. A shape is named, in order of preference:
 *
 * - by the label it states in the target language
 * - by the prefixed name of the class it states under `lexicon`, as `schema:Organization`, or by the class IRI if
 *   `lexicon` has no prefix for it
 * - by the names of the shapes it extends, joined with ` & `, as `RDFS Entity & Geo Point`, leaving what it adds to
 *   them to be documented apart; a shape extending nothing is named `Object`
 *
 * @param shape The shape to be named, possibly deferred
 * @param lexicon The prefixes class names are written with
 * @param language The target language of labels
 *
 * @returns The display name of `shape`
 */
export function nameShape(shape: Lazy<ResourceShape>, lexicon: Lexicon, language: Tag = "en"): string {

	const { name, class: type, parents } = eager(shape);

	return labelled(name, language)
		?? opt(type, iri => compact(lexicon, iri) ?? iri)
		?? (parents.length > 0 ? parents.map(parent => nameShape(parent, lexicon, language)).join(" & ") : "Object");

	/**
	 * Retrieves the label stated in a language.
	 */
	function labelled(name: ResourceShape["name"], language: Tag): Optional<string> {

		const label = isString(name) ? { en: name }[language] : name?.[language];

		return isString(label) ? label : label?.[0];

	}

}

/**
 * Retrieves the members a resource shape states in its own right.
 *
 * A member is the shape's own if none of the shapes it extends states a member under the same name, or if it differs
 * from what each of them states under that name in what it admits or how its values are stored: its predicates, its
 * flags, its bounds and the shape of its values, with linked and embedded resource shapes compared by identity.
 * Members inherited unchanged, or restated with a different name or description alone, are left out.
 *
 * @param shape The resource shape whose own members are to be retrieved, possibly deferred
 *
 * @returns The members `shape` declares or narrows in its own right, keyed by name, in declaration order
 */
export function getOwnMembers(shape: Lazy<ResourceShape>): Members {

	const { parents, members } = eager(shape);

	return Object.fromEntries(Object.entries(members).filter(([name, member]) =>
		!parents.some(parent => opt(eager(parent).members[name], peer => equivalent(peer, member)))
	));


	/**
	 * Checks whether two members admit the same values stored the same way.
	 */
	function equivalent(x: Member, y: Member): boolean {
		return x.kind === "property" && y.kind === "property"
			? alike(x, y, "range") && alike(x.range, y.range, "shape") && same(x.range.shape, y.range.shape)
			: alike(x, y);
	}

	/**
	 * Checks whether two shapes admit the same values, comparing resource shapes by identity.
	 */
	function same(x: Lazy<Shape>, y: Lazy<Shape>): boolean {

		const a = eager(x);
		const b = eager(y);

		return a === b || (
			a.kind === "reference" && b.kind === "reference" ? eager(a.target) === eager(b.target)
				: a.kind === "union" && b.kind === "union" ? a.branches.length === b.branches.length
					&& a.branches.every((branch, index) => opt(b.branches[index], peer => same(branch, peer)) ?? false)
					: a.kind !== "resource" && b.kind !== "resource" && alike(a, b)
		);

	}

	/**
	 * Checks whether two objects state the same literal values, leaving out what only describes them and the `excluded`
	 * keys compared apart.
	 */
	function alike(x: object, y: object, ...excluded: readonly string[]): boolean {

		const ignored = new Set(["name", "description", "validators", ...excluded]);

		return [...new Set([...Object.keys(x), ...Object.keys(y)])]
			.filter(key => !ignored.has(key))
			.every(key => equals(Reflect.get(x, key), Reflect.get(y, key)));

	}

}


/**
 * Lists the documented shapes of the model by inheritance.
 *
 * Roots are the documented shapes extending no documented shape; each shape is nested under every documented shape it
 * extends, directly or through undocumented ones, so a shape with several documented parents is listed under each.
 *
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 * @param lexicon The prefixes abbreviating the IRIs of the model
 *
 * @returns The documented shapes, each followed by the shapes extending it; at every level of the hierarchy, the
 *     shapes served at container routes come first, in the order of their routes, and the others follow by name
 */
export function getModelHierarchy(endpoints: Endpoints, lexicon: Lexicon): readonly Model[] {

	const containers = getContainers(endpoints);
	const entries = containers.map(shape => eager(shape));

	const named = by(({ shape }: Pick<Model, "shape">) => nameShape(shape, lexicon), locale());
	const ranked = ({ shape }: Pick<Model, "shape">) => entries.includes(shape) ? entries.indexOf(shape) : entries.length;

	const models = model(containers)
		.flatMap(shape => located(endpoints, lexicon, shape))
		.sort((x, y) => ranked(x)-ranked(y) || named(x, y)); // fresh array from flatMap

	const hrefs = new Set(models.map(({ href }) => href));

	const listed = models.map(({ href, shape }) => ({
		href, shape, parents: documented(endpoints, lexicon, shape)
			.flatMap(parent => located(endpoints, lexicon, parent))
			.map(({ href }) => href)
			.filter(href => hrefs.has(href))
	}));

	return nested(parents => parents.length === 0, 0, "");


	function nested(select: (parents: readonly string[]) => boolean, depth: number, prefix: string): readonly Model[] {
		return listed.filter(({ parents }) => select(parents)).flatMap(({ href, shape }) => {

			const path = `${prefix}${href}`;

			return [{ href, shape, depth, path }, ...nested(parents => parents.includes(href), depth+1, `${path} `)];

		});
	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * A member a shape documents, under the name it is keyed by.
 */
type Declared = readonly [term: string, member: Member];

/**
 * The documented model served at a set of routes: the shapes reachable from the route shapes, as listed by their
 * {@link @metreeca/blue!model model}, and the identifier of each of them documented on a page of its own.
 */
type Catalogue = {

	readonly shapes: readonly ResourceShape[]

	readonly identities: ReadonlyMap<ResourceShape, string>

};


/**
 * Retrieves the catalogue of the model served at a set of routes, computing it on first use.
 */
function catalogue(endpoints: Endpoints, lexicon: Lexicon): Catalogue {
	return catalogues.get(endpoints)?.get(lexicon) ?? catalogued(endpoints, lexicon);
}

/**
 * Computes the catalogue of the model served at a set of routes and records it for later uses.
 */
function catalogued(endpoints: Endpoints, lexicon: Lexicon): Catalogue {

	const shapes = model(Object.values(endpoints));
	const computed = { shapes, identities: identify(lexicon, shapes) };

	catalogues.set(endpoints, (catalogues.get(endpoints) ?? new WeakMap()).set(lexicon, computed)); // memoised per pair

	return computed;

}

/**
 * Checks whether a member is documented apart from an inherited member: the shape declaring it has no member of the
 * same name to inherit, or labels or describes a property differently from the inherited one.
 */
function refines(member: Member, inherited: Optional<Member>): boolean {
	return inherited === undefined || member.kind === "property" && inherited.kind === "property" && (
		!equals(member.name, inherited.name) || !equals(member.description, inherited.description)
	);
}

/**
 * Links a list of shapes to their documentation, leaving out the ones sharing the documentation of a target shape and
 * listing each documentation once.
 */
function others(
	endpoints: Endpoints,
	lexicon: Lexicon,
	target: ResourceShape,
	shapes: readonly ResourceShape[]
): readonly ShapeLink[] {

	const self = linked(endpoints, lexicon, target);

	return shapes
		.map(shape => linked(endpoints, lexicon, shape))
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
 * Collapses runs of whitespace into single spaces, trimming the ends.
 */
function collapse(text: string): string {
	return text.trim().replace(/\s+/g, " ");
}

/**
 * Identifies each shape of a model by a slug: classed shapes by the prefixed name of their class; class-less shapes,
 * until digest identities land, by their English label, or by `Shape` if they state none, numbering from 1 in model
 * order the ones whose labels would clash; anonymous shapes used at a single site are left out, as the page of the
 * shape using them documents them in place, where readers meet them, rather than on a page of their own.
 *
 * @throws RangeError If two shapes would still share an identifier, as a label slugged like a class or a numbered peer
 */
function identify(lexicon: Lexicon, shapes: readonly ResourceShape[]): ReadonlyMap<ResourceShape, string> {

	const anonymous = "Shape";

	const classed = classify(shapes, lexicon);
	const uses = sites(shapes);

	const bases = shapes
		.filter(shape => !classed.has(shape))
		.map(shape => ({ shape, base: english(shape.name) }))
		.filter(({ shape, base }) => base !== undefined || uses.filter(use => use === shape).length > 1);

	const identities = [...classed, ...bases.map(({ shape, base }): [ResourceShape, string] => {

		const label = base ?? anonymous;
		const peers = bases.filter(peer => slug(peer.base ?? anonymous) === slug(label)).map(peer => peer.shape);

		return [shape, slug(base !== undefined && peers.length === 1 ? label : `${label} ${peers.indexOf(shape)+1}`)];

	})];

	const duplicate = identities.find(([, id], index) => identities.findIndex(([, peer]) => peer === id) !== index);

	return duplicate !== undefined
		? error(new RangeError(`duplicated identifier <${duplicate[1]}> of shape <${nameShape(duplicate[0], lexicon)}>`))
		: new Map(identities);

}

/**
 * Lists the shapes a model uses, once for each site using them: each shape extended, and each shape linked or embedded
 * by a member a shape declares or narrows in its own right, so that inherited members do not count again.
 */
function sites(shapes: readonly ResourceShape[]): readonly ResourceShape[] {
	return [
		...shapes.flatMap(shape => shape.parents.map(parent => eager(parent))),
		...shapes.flatMap(shape => Object.values(getOwnMembers(shape))).flatMap(member =>
			member.kind === "property" ? targets(member.range.shape) : []
		)
	];
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

/**
 * Locates the page documenting a shape, unless no page documents it.
 */
function located(
	endpoints: Endpoints,
	lexicon: Lexicon,
	lazy: Lazy<ResourceShape>
): readonly Pick<Model, "href" | "shape">[] {

	const shape = eager(lazy);

	return opt(getShapeId(endpoints, lexicon, shape), href => [{ href, shape }]) ?? [];

}
