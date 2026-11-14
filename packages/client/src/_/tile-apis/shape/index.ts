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
import { byte, decimal, double, float, int, integer, long, short, type NumberShape } from "@metreeca/blue/number";
import type { DictionaryShape } from "@metreeca/blue/dictionary";
import type { Id, Member, Property, ResourceShape, Type } from "@metreeca/blue/resource";
import {
	date,
	duration,
	email,
	instant,
	iri,
	markdown,
	phone,
	tag,
	text,
	time,
	timestamp,
	type StringShape,
	url,
	year
} from "@metreeca/blue/string";
import { eager, type Shape } from "@metreeca/blue/value";
import { isArray, isString, type Lazy, opt, type Optional } from "@metreeca/core";
import type { Some } from "@metreeca/core/arrays";
import { base, compact } from "@metreeca/core/resource";
import { dedent } from "@metreeca/core/strings";
import { equals } from "@metreeca/core/values";
import { summary } from "@metreeca/work/core/_strings.js";


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
	 * The members the shape declares in its own right, labels or describes in its own terms, or inherits from shapes
	 * outside the model, in declaration order, leaving out hidden ones and the ones its nearest documented ancestors
	 * declare with the same name and description, even where their range is narrowed.
	 */
	readonly rows: readonly ShapeRow[]

	/**
	 * The members the shape inherits from its documented ancestors, grouped by the ancestor declaring them, from the
	 * nearest to the most general; each member is listed once, as narrowed by the shape.
	 */
	readonly inherited: readonly ShapeGroup[]

	/**
	 * The names of the custom checks a resource must pass beyond the declarative constraints, in declaration order,
	 * inherited ones included; a check stating no name is listed as `check`. Empty if the shape states none.
	 */
	readonly checks: readonly string[]

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
	readonly rows: readonly ShapeRow[]

};

/**
 * The documentation row of a member declared by a resource shape: a property, or the member carrying the identifier
 * (`@id`) or the class (`@type`) of the resource, both assigned by the server and stated once per resource; the class
 * member is left out on shapes stating no class, which admit no value for it.
 */
export type ShapeRow = {

	/**
	 * The name the member is keyed by in resource states.
	 */
	readonly term: string

	/**
	 * The English label of the property; none if not stated in English, or if the member is not a property.
	 */
	readonly label: Optional<string>

	/**
	 * The IRI of the predicate the property maps to in the forward direction; none if the property states no forward
	 * mapping, maps to the default namespace, or is not a property at all.
	 */
	readonly predicate: Optional<string>

	/**
	 * The IRI of the predicate the property maps to in the inverse direction, linking each value to the resource as its
	 * subject; none if the property states no inverse mapping, maps to the default namespace, or is not a property.
	 */
	readonly reverse: Optional<string>

	/**
	 * The types of the member values, one for each alternative the member admits, with the restrictions each states:
	 * the shape of linked or embedded resources, `Dictionary` for localised text, the name of the shorthand plain
	 * values were defined with, as `email` or `url`, else the local name of their datatype, or the value kind where no
	 * datatype is stated; `iri` for the identifier and class members. Only the shapes among them are linked to their
	 * own documentation pages.
	 */
	readonly types: readonly ShapeType[]

	/**
	 * The least number of values the member admits.
	 */
	readonly minCount: number

	/**
	 * The greatest number of values the member admits; none if unbounded.
	 */
	readonly maxCount: Optional<number>

	/**
	 * The description of the member, as English markdown realigned to the left margin; none if not stated in English.
	 */
	readonly description: Optional<string>

	/**
	 * Whether the member carries the identifier or the class of the resource, both assigned by the server and never
	 * stated by clients.
	 */
	readonly managed: boolean

	/**
	 * Whether the property is written by the resources in its range, and so read-only for the resource exposing it.
	 */
	readonly foreign: boolean

	/**
	 * Whether the resources the property links to are removed together with the resource declaring it.
	 */
	readonly captive: boolean

};

/**
 * A type of the values of a member, with the restrictions it states on them.
 */
export type ShapeType = ShapeLink & {

	/**
	 * The restrictions the type states on its values beyond the ones implied by the shorthand it was defined with.
	 */
	readonly restrictions: ShapeRestrictions

};

/**
 * The restrictions a type states on its values, named after the constraints of the model language stating them; a
 * restriction left unstated, or stated as an empty list, does not apply.
 */
export type ShapeRestrictions = {

	/**
	 * The regular expression string values must match.
	 */
	readonly pattern?: string

	/**
	 * The IRI template the identifiers of linked or embedded resources, or of the resource itself, must match.
	 */
	readonly template?: string

	/**
	 * The least number of characters of string values, or of each string of localised text.
	 */
	readonly minLength?: number

	/**
	 * The greatest number of characters of string values, or of each string of localised text.
	 */
	readonly maxLength?: number

	/**
	 * The language ranges the tags of localised text must match.
	 */
	readonly languageIn?: readonly string[]

	/**
	 * Whether each language of localised text carries a single string.
	 */
	readonly uniqueLang?: boolean

	/**
	 * Whether number values must be integral, where their datatype does not imply it.
	 */
	readonly integral?: boolean

	/**
	 * The least number values may equal.
	 */
	readonly minInclusive?: number

	/**
	 * The greatest number values may equal.
	 */
	readonly maxInclusive?: number

	/**
	 * The bound number values must exceed.
	 */
	readonly minExclusive?: number

	/**
	 * The bound number values must stay below.
	 */
	readonly maxExclusive?: number

	/**
	 * The values admitted, or the identifiers of the resources admitted.
	 */
	readonly in?: readonly (string | number | boolean)[]

	/**
	 * The values required, or the identifiers of the resources required.
	 */
	readonly hasValue?: readonly (string | number)[]

};

/**
 * A named reference to a type, linked to its documentation where known.
 */
export type ShapeLink = {

	/**
	 * The name of the type: the {@link getShapeName | name} of a shape, as `Schema Organization`, or else the name of
	 * the type of plain values, as `Dictionary` for localised text or the local name of a datatype such as `dateTime`.
	 */
	readonly name: string

	/**
	 * The location of the documentation of the type, relative to the models section: the {@link getShapeId | identifier}
	 * of a shape; none if the type is not a shape or its documentation is not located.
	 */
	readonly href: Optional<string>

};

/**
 * The TypeScript interface describing the resources of a shape.
 */
export type ShapeInterface = {

	/**
	 * The name of the interface: the {@link getShapeName | name} of the shape, stripped of the characters not allowed
	 * in TypeScript identifiers.
	 */
	readonly name: string

	/**
	 * The interfaces extended by the interface, one for each nearest documented ancestor of the shape, linked to its
	 * documentation.
	 */
	readonly parents: readonly ShapeLink[]

	/**
	 * The members of the interface, in declaration order: the ones the shape declares in its own right, including the
	 * identifier and the class of its resources, and the inherited ones it narrows.
	 */
	readonly members: readonly ShapeMember[]

};

/**
 * A member of the TypeScript interface describing the resources of a shape: a property, or the member carrying the
 * identifier or the class of the resource, typed as `string`.
 */
export type ShapeMember = {

	/**
	 * The name the member is keyed by in resource states.
	 */
	readonly term: string

	/**
	 * Whether the member admits no value.
	 */
	readonly optional: boolean

	/**
	 * Whether the member admits more than one value for its {@link types}, typed as an array; localised text is never
	 * arrayed, being carried as a whole map whatever bounds the member states.
	 */
	readonly plural: boolean

	/**
	 * The least number of values the member admits for its {@link types}.
	 */
	readonly minCount: number

	/**
	 * The greatest number of values the member admits for its {@link types}; none if unbounded.
	 */
	readonly maxCount: Optional<number>

	/**
	 * The TypeScript types of the member values other than localised text, one for each distinct alternative the member
	 * admits, with the restrictions it states: the interfaces of linked or embedded resources, linked to their
	 * documentation, or `string`, `number` and `boolean` for plain values.
	 */
	readonly types: readonly ShapeType[]

	/**
	 * The localised text the member admits as an alternative, named `Dictionary`, with the restrictions it states,
	 * whether each language carries a single string among them; none if the member admits no localised text.
	 */
	readonly dictionary: Optional<ShapeType>

	/**
	 * The English label of the property; none if not stated in English, or if the member is not a property.
	 */
	readonly label: Optional<string>

	/**
	 * The IRI of the predicate the property maps to in the forward direction; none if the property states no forward
	 * mapping, maps to the default namespace, or is not a property at all.
	 */
	readonly predicate: Optional<string>

	/**
	 * The IRI of the predicate the property maps to in the inverse direction; none if the property states no inverse
	 * mapping, maps to the default namespace, or is not a property at all.
	 */
	readonly reverse: Optional<string>

	/**
	 * Whether the member is assigned by the server, as {@link ShapeRow.managed}.
	 */
	readonly managed: boolean

	/**
	 * Whether the property is written by the resources in its range, as {@link ShapeRow.foreign}.
	 */
	readonly foreign: boolean

	/**
	 * Whether the resources the property links to are removed with the resource, as {@link ShapeRow.captive}.
	 */
	readonly captive: boolean

	/**
	 * The first paragraph of the English description of the member, with whitespace collapsed; none if not stated.
	 */
	readonly summary: Optional<string>

};

/**
 * A JSON Schema object.
 */
export type ShapeSchema = {

	readonly [keyword: string]: ShapeSchemaValue

};

/**
 * A value of a JSON Schema keyword.
 */
export type ShapeSchemaValue = string | number | boolean | readonly ShapeSchemaValue[] | ShapeSchema;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Tabulates a resource shape for documentation.
 *
 * @param lazy The shape to be tabulated, possibly deferred
 *
 * @returns The table of the members `lazy` declares or inherits, with the custom checks its resources must pass
 */
export function tabulate(lazy: Lazy<ResourceShape>): ShapeTable {

	const shape = eager(lazy);

	return {

		name: getShapeName(shape),
		class: shape.class,
		endpoint: opt(shape.pattern, pattern => pattern.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, "")),
		parents: shape.parents.map(linked),

		rows: declared(shape).map(([term, member]) => row(shape, term, member)),

		inherited: ancestry(shape)
			.map((ancestor, index, ancestors) => group(shape, ancestor, ancestors.slice(0, index)))
			.filter(({ rows }) => rows.length > 0),

		checks: checked(shape)

	};

}

/**
 * Names the custom checks a shape states, inherited ones included.
 */
function checked(shape: ResourceShape): readonly string[] {
	return (shape.validators ?? []).map(({ name }) => name !== "" ? name : "check");
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
 * Groups the members a shape inherits from a documented ancestor, as narrowed by the shape, leaving out the ones
 * the shape documents in its own terms or already grouped under nearer ancestors, so that each is listed once.
 */
function group(shape: ResourceShape, ancestor: ResourceShape, nearer: readonly ResourceShape[]): ShapeGroup {

	const grouped = [shape, ...nearer].flatMap(declared).map(([term]) => term);

	return {

		parent: linked(ancestor),

		rows: declared(ancestor).flatMap(([term]) => {

			const member = shown(shape, term);

			return !grouped.includes(term) && member !== undefined ? [row(shape, term, member)] : [];

		})

	};

}

/**
 * Lists the visible members a shape documents: the ones it declares in its own right or inherits from shapes outside
 * the model, which have no documentation of their own, and the properties it labels or describes in its own terms,
 * leaving out the ones its documented ancestors declare with the same name and description.
 */
function declared(shape: ResourceShape): readonly (readonly [string, Member])[] {

	const ancestors = documented(shape);

	return Object.keys(shape.members).flatMap(term => opt(shown(shape, term), member =>
		ancestors.every(ancestor => refines(member, shown(ancestor, term))) ? [[term, member] as const] : []
	) ?? []);

}

/**
 * Retrieves the member a shape shows under a name: none if hidden, or if it carries the class of the resource on a
 * shape stating no class, which admits no value for it.
 */
function shown(shape: ResourceShape, term: string): Optional<Member> {

	const member = shape.members[term];

	return member === undefined || member.hidden || member.kind === "type" && shape.class === undefined
		? undefined
		: member;

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
 * Lists the nearest documented ancestors of a shape, looking through the shapes outside the model it extends.
 */
function documented(shape: ResourceShape): readonly ResourceShape[] {
	return shape.parents.flatMap(lazy => {

		const parent = eager(lazy);

		return identities.has(parent) ? [parent] : documented(parent);

	});
}

/**
 * Tabulates a member of a shape.
 */
function row(shape: ResourceShape, term: string, member: Member): ShapeRow {
	return member.kind === "property" ? {

		term,
		label: english(member.name),
		predicate: mapped(member.forward),
		reverse: mapped(member.reverse),
		types: typed(member.range.shape),
		minCount: member.range.minCount ?? 0,
		maxCount: member.range.maxCount,
		description: markup(member.description),
		managed: false,
		foreign: member.foreign ?? false,
		captive: member.captive ?? false

	} : {

		term,
		label: undefined,
		predicate: undefined,
		reverse: undefined,
		types: [{ name: "iri", href: undefined, restrictions: keyed(shape, member) }],
		minCount: 1,
		maxCount: 1,
		description: keyword(member),
		managed: true,
		foreign: false,
		captive: false

	};
}

/**
 * Describes the member carrying the identifier or the class of a resource.
 */
function keyword(member: Id | Type): string {
	return member.kind === "id"
		? "IRI identifying the resource, assigned and managed by the server."
		: "IRI of the class of the resource, set by the server from the class of the shape.";
}

/**
 * Retrieves the restrictions on the member carrying the identifier or the class of a resource: the ones the shape
 * states on its identifiers, or its class as the required value.
 */
function keyed(shape: ResourceShape, member: Id | Type): ShapeRestrictions {
	return member.kind === "id" ? restrictions(shape) : opt(shape.class, type => ({ hasValue: [type] })) ?? {};
}

/**
 * A shorthand of the model language, as the shape it creates when given no constraints of its own.
 */
type Shorthand = {

	/**
	 * The name of the shorthand, naming the type of the values it admits.
	 */
	readonly name: string

	/**
	 * The JSON Schema format the values the shorthand admits conform to; none if JSON Schema names no such format.
	 */
	readonly format?: string

	/**
	 * The shape the shorthand creates, stating the constraints implied by the type of the values it admits.
	 */
	readonly shape: StringShape | NumberShape

};

/**
 * The shorthands of the model language, the ones naming a type more specific than another sharing its shape coming
 * first, so that the IRIs `url()` admits are named `url` rather than `iri`.
 */
const shorthands: readonly Shorthand[] = [
	{ name: "text", shape: text() },
	{ name: "markdown", shape: markdown() },
	{ name: "email", format: "email", shape: email() },
	{ name: "phone", shape: phone() },
	{ name: "url", format: "uri", shape: url() },
	{ name: "iri", format: "iri", shape: iri({ variant: "absolute" }) },
	{ name: "iri", format: "iri-reference", shape: iri({ variant: "internal" }) },
	{ name: "iri", format: "iri-reference", shape: iri({ variant: "relative" }) },
	{ name: "tag", shape: tag() },
	{ name: "year", shape: year() },
	{ name: "date", format: "date", shape: date() },
	{ name: "time", format: "time", shape: time() },
	{ name: "instant", format: "date-time", shape: instant() },
	{ name: "timestamp", format: "date-time", shape: timestamp() },
	{ name: "duration", format: "duration", shape: duration() },
	...[byte(), short(), int(), long(), float(), double(), integer(), decimal()].map(shape => ({
		name: opt(shape.datatype, local) ?? shape.kind, shape
	}))
];

/**
 * Retrieves the shorthand a plain shape was created with, if any: the one admitting values of the same kind and
 * datatype and, for strings, matching the same pattern.
 */
function shorthand(shape: Shape): Optional<Shorthand> {
	return shorthands.find(({ shape: base }) => base.kind === "string" && shape.kind === "string"
		? base.datatype === shape.datatype && base.pattern === shape.pattern
		: base.kind === "number" && shape.kind === "number" && base.datatype === shape.datatype
	);
}

/**
 * Retrieves the restrictions implied by the shorthand a shape was created with, if any.
 */
function implied(shape: Exclude<Shape, { readonly kind: "union" }>): ShapeRestrictions {
	return opt(shorthand(shape), ({ shape }) => restrictions(shape, {})) ?? {};
}

/**
 * Retrieves the restrictions a shape other than a union states beyond the given ones, by default the ones implied by
 * the shorthand it was created with: the ones on plain values, or the ones on the identifiers of linked or embedded
 * resources.
 */
function restrictions(
	shape: Exclude<Shape, { readonly kind: "union" }>,
	given: ShapeRestrictions = implied(shape)
): ShapeRestrictions {

	function fresh<K extends keyof ShapeRestrictions>(key: K, value: ShapeRestrictions[K]): ShapeRestrictions {
		return value === undefined || isArray(value) && value.length === 0 || equals(value, given[key])
			? {}
			: { [key]: value };
	}

	return shape.kind === "reference" ? restrictions(eager(shape.target))

		: shape.kind === "resource" ? {
			...fresh("template", shape.pattern),
			...fresh("in", shape.in),
			...fresh("hasValue", shape.hasValue)
		}

			: shape.kind === "string" ? {
				...fresh("pattern", shape.pattern),
				...fresh("minLength", shape.minLength),
				...fresh("maxLength", shape.maxLength),
				...fresh("in", shape.in),
				...fresh("hasValue", shape.hasValue)
			}

				: shape.kind === "number" ? {
					...fresh("integral", shape.integral && shape.datatype === undefined ? true : undefined),
					...fresh("minInclusive", shape.minInclusive),
					...fresh("maxInclusive", shape.maxInclusive),
					...fresh("minExclusive", shape.minExclusive),
					...fresh("maxExclusive", shape.maxExclusive),
					...fresh("in", shape.in),
					...fresh("hasValue", shape.hasValue)
				}

					: shape.kind === "dictionary" ? {
						...fresh("languageIn", shape.languageIn),
						...fresh("uniqueLang", shape.uniqueLang),
						...fresh("minLength", shape.minLength),
						...fresh("maxLength", shape.maxLength)
					}

						: fresh("in", opt(shape.in, value => [value]));

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
 * As a location, the identifier is relative to the models section: it resolves as is from any page of the section and
 * must be prefixed by the route of the section when linked from a page elsewhere, as the dataset pages do.
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
		.filter(shape => declared(shape).some(([, member]) =>
			member.kind === "property" && targets(member.range.shape).includes(target)
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
 * Describes a resource shape as a TypeScript interface.
 *
 * States the interface extending the nearest documented ancestors of `lazy`, with the members it declares in its own
 * right and the inherited ones it narrows, stating their types, restrictions, bounds or flags differently from at
 * least one ancestor declaring them.
 *
 * @param lazy The shape to be described, possibly deferred
 *
 * @returns The TypeScript interface describing the resources of `lazy`
 */
export function getShapeInterface(lazy: Lazy<ResourceShape>): ShapeInterface {

	const shape = eager(lazy);
	const ancestors = documented(shape);

	return {

		name: identifier(shape),
		parents: ancestors.map(scriptable),

		members: Object.keys(shape.members).flatMap(term => {

			const signature = opt(shown(shape, term), member => signed(shape, term, member));

			const inherited = ancestors.flatMap(ancestor => opt(shown(ancestor, term), declaration =>
				[signed(ancestor, term, declaration)]
			) ?? []);

			return signature !== undefined && (inherited.length === 0 || inherited.some(ancestor =>
				!equals(spelled(ancestor), spelled(signature))
			)) ? [signature] : [];

		})

	};

}

/**
 * Describes a resource shape as a JSON Schema.
 *
 * States the schema of the payloads `lazy` admits, with the members of its {@link getShapeInterface | interface},
 * requiring the schemas of its nearest documented ancestors through `allOf`; shapes are referred to by `$ref` to their
 * documentation. The schema is titled after the shape and annotated with its {@link getShapeSummary | summary} as
 * `description`, the prefixed name of its class as `$comment` and the names of its custom checks as `x-checks`.
 *
 * Each member is annotated alike with its label as `title`, its summary as `description` and its predicate as
 * `$comment`, an inverse one prefixed by `^`, and states every constraint JSON Schema can express:
 *
 * - array bounds as `minItems` and `maxItems`, a foreign property as `readOnly` and `x-foreign`;
 * - strings by `format` where defined with a shorthand JSON Schema names, as `email` or `uri`, by `pattern` otherwise,
 *   and by `minLength`, `maxLength`, `enum` and `const`, or `x-includes` where several values are required;
 * - numbers by `type: integer` where integral, `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `enum`
 *   and `const`, or `x-includes` where several values are required, booleans by `const`;
 * - localised text as an object mapping language tags to a string, or to an array of strings where a tag may carry
 *   several, never wrapped in an array, with its tags bounded by `propertyNames` and its strings by length;
 * - the identifier as an `iri` formatted string bounded by the pattern, `enum` and `const` the shape states, the class
 *   member as the `const` class, both required and marked `readOnly`, as the server assigns them.
 *
 * The constraints JSON Schema cannot express on a `$ref` are stated as annotations: `x-id`, `x-values` and
 * `x-value` on links to resources, `x-lifecycle` on properties whose values are removed with the resource.
 *
 * @param lazy The shape to be described, possibly deferred
 *
 * @returns The JSON Schema describing the resources of `lazy`
 */
export function getShapeSchema(lazy: Lazy<ResourceShape>): ShapeSchema {

	const shape = eager(lazy);
	const { parents, members } = getShapeInterface(shape);

	const required = members.filter(({ optional }) => !optional).map(({ term }) => term);
	const checks = checked(shape);

	return {

		title: getShapeName(shape),

		...opt(getShapeSummary(shape), description => ({ description })),
		...opt(shape.class, type => ({ $comment: prefixed(type) })),
		...(checks.length > 0 ? { "x-checks": checks } : {}),

		...(parents.length > 0 ? { allOf: parents.map(referred) } : {}),

		type: "object",
		properties: Object.fromEntries(members.map(member => [member.term, valued(shape, member)])),

		...(required.length > 0 ? { required } : {})

	};

}

/**
 * Describes the values of a member of a TypeScript interface as a JSON Schema, annotated with its label, summary and
 * predicates.
 */
function valued(shape: ResourceShape, signature: ShapeMember): ShapeSchema {

	const member = shape.members[signature.term];
	const { label, summary, predicate, reverse } = signature;

	const comment = [opt(predicate, prefixed), opt(reverse, iri => `^${prefixed(iri)}`)].filter(isString).join(", ");

	return {

		...opt(label, title => ({ title })),
		...opt(summary, description => ({ description })),
		...(comment !== "" ? { $comment: comment } : {}),

		...(member?.kind === "property" ? spanned(member, signature) : {
			readOnly: true,
			type: "string",
			...(member?.kind === "id"
				? { format: "iri", ...identifying(shape, "enum"), ...including(shape.hasValue) }
				: opt(shape.class, type => ({ const: type })))
		})

	};

}

/**
 * Describes the values of a property as a JSON Schema: its localised text as a whole map, never arrayed, and its
 * other alternatives as items of an array where it admits several values.
 */
function spanned({ range, foreign, captive }: Property, { plural }: ShapeMember): ShapeSchema {

	const alternatives = branches(range.shape);

	const maps = alternatives.flatMap(branch => branch.kind === "dictionary" ? [schematised(branch)] : []);

	const values = alternatives
		.flatMap(branch => branch.kind === "dictionary" ? [] : [schematised(branch)])
		.filter((value, index, values) => values.findIndex(other => equals(other, value)) === index);

	const [map] = maps;
	const [value] = values;

	const items = value !== undefined && values.length === 1 ? value : { anyOf: values };
	const min = range.minCount ?? 0;

	const arrayed = plural ? {
		type: "array",
		items,
		...(min > 0 ? { minItems: min } : {}),
		...opt(range.maxCount, maxItems => ({ maxItems }))
	} : items;

	return {

		...(foreign ? { readOnly: true, "x-foreign": true } : {}),
		...(captive ? { "x-lifecycle": "bound" } : {}),

		...(values.length === 0 ? map ?? {} : map === undefined ? arrayed : { anyOf: [map, arrayed] })

	};

}

/**
 * Describes the values of a shape other than a union as a JSON Schema, stating every constraint JSON Schema can
 * express on them.
 */
function schematised(shape: Exclude<Shape, { readonly kind: "union" }>): ShapeSchema {
	return shape.kind === "reference" ? linking(eager(shape.target))
		: shape.kind === "resource" ? linking(shape)
			: shape.kind === "string" ? {
					type: "string",
					...opt(shorthand(shape)?.format, format => ({ format }))
					?? opt(shape.pattern, pattern => ({ pattern })),
					...opt(shape.minLength, minLength => ({ minLength })),
					...opt(shape.maxLength, maxLength => ({ maxLength })),
					...opt(filled(shape.in), values => ({ enum: values })),
					...including(shape.hasValue)
				}
				: shape.kind === "number" ? {
						type: shape.integral ? "integer" : "number",
						...opt(shape.minInclusive, minimum => ({ minimum })),
						...opt(shape.maxInclusive, maximum => ({ maximum })),
						...opt(shape.minExclusive, exclusiveMinimum => ({ exclusiveMinimum })),
						...opt(shape.maxExclusive, exclusiveMaximum => ({ exclusiveMaximum })),
						...opt(filled(shape.in), values => ({ enum: values })),
						...including(shape.hasValue)
					}
					: shape.kind === "boolean" ? {
							type: "boolean",
							...opt(shape.in, value => ({ const: value }))
						}
						: localising(shape);
}

/**
 * Describes localised text as a JSON Schema: an object mapping the language tags it admits to a string, or to an
 * array of strings where a tag may carry several, each bounded in length.
 */
function localising(shape: DictionaryShape): ShapeSchema {

	const text = {
		type: "string",
		...opt(shape.minLength, minLength => ({ minLength })),
		...opt(shape.maxLength, maxLength => ({ maxLength }))
	};

	const languages = filled(shape.languageIn);

	return {

		type: "object",

		...(languages !== undefined && !languages.includes("*") ? {
			propertyNames: { pattern: `^(?:${languages.join("|")})(?:-|$)` }
		} : {}),

		additionalProperties: shape.uniqueLang ? text : { type: "array", items: text }

	};

}

/**
 * Refers to linked or embedded resources by the location of their documentation, annotated with the constraints the
 * shape states on their identifiers.
 */
function linking(shape: ResourceShape): ShapeSchema {

	const { href, name } = scriptable(shape);

	return {
		$ref: href ?? name,
		...identifying(shape, "x-values"),
		...opt(filled(shape.hasValue), values => ({ "x-value": values }))
	};

}

/**
 * States the pattern the identifiers of the resources of a shape match, as the `x-id` annotation, and the
 * identifiers it lists under the given keyword.
 */
function identifying(shape: ResourceShape, listing: string): ShapeSchema {
	return {
		...opt(shape.pattern, pattern => ({ "x-id": pattern })),
		...opt(filled(shape.in), values => ({ [listing]: values }))
	};
}

/**
 * States the values a plain value must equal: as `const` where a single one is required, as the `x-includes`
 * annotation otherwise.
 */
function including(values: Optional<readonly (string | number)[]>): ShapeSchema {

	const [value] = values ?? [];

	return value !== undefined && values?.length === 1 ? { const: value }
		: opt(filled(values), values => ({ "x-includes": values })) ?? {};

}

/**
 * Retrieves a list, unless missing or empty.
 */
function filled<T>(values: Optional<readonly T[]>): Optional<readonly T[]> {
	return values !== undefined && values.length > 0 ? values : undefined;
}

/**
 * Lists the alternatives of a shape, looking through unions.
 */
function branches(lazy: Lazy<Shape>): readonly Exclude<Shape, { readonly kind: "union" }>[] {

	const shape = eager(lazy);

	return shape.kind === "union" ? shape.branches.flatMap(branches) : [shape];

}

/**
 * Describes a TypeScript interface as a JSON Schema, referring to it by the location of its documentation.
 */
function referred({ name, href }: ShapeLink): ShapeSchema {
	return { $ref: href ?? name };
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
 * Links a resource shape to its documentation.
 */
function linked(lazy: Lazy<ResourceShape>): ShapeLink {
	return { name: getShapeName(lazy), href: getShapeId(lazy) };
}

/**
 * Lists the types of the values a shape admits, one for each alternative, with the restrictions each states.
 */
function typed(lazy: Lazy<Shape>): readonly ShapeType[] {
	return branches(lazy).map(shape => ({
		...shape.kind === "reference" ? linked(shape.target)
			: shape.kind === "resource" ? linked(shape)
				: { name: plain(shape), href: undefined },
		restrictions: restrictions(shape)
	}));
}

/**
 * Describes a member of a shape as a member of a TypeScript interface.
 */
function signed(shape: ResourceShape, term: string, member: Member): ShapeMember {

	if ( member.kind === "property" ) {

		const { name, forward, reverse, range, description, foreign, captive } = member;

		const types = scripted(range.shape);
		const max = range.maxCount;

		return {
			term,
			optional: (range.minCount ?? 0) === 0,
			plural: types.length > 0 && (max === undefined || max > 1),
			minCount: range.minCount ?? 0,
			maxCount: max,
			types,
			dictionary: opt(branches(range.shape).find(branch => branch.kind === "dictionary"), dictionary => ({
				name: "Dictionary", href: undefined, restrictions: restrictions(dictionary)
			})),
			label: english(name),
			predicate: mapped(forward),
			reverse: mapped(reverse),
			managed: false,
			foreign: foreign ?? false,
			captive: captive ?? false,
			summary: opt(markup(description), summarize)
		};

	} else {

		return {
			term,
			optional: false,
			plural: false,
			minCount: 1,
			maxCount: 1,
			types: [{ name: "string", href: undefined, restrictions: keyed(shape, member) }],
			dictionary: undefined,
			label: undefined,
			predicate: undefined,
			reverse: undefined,
			managed: true,
			foreign: false,
			captive: false,
			summary: keyword(member)
		};

	}

}

/**
 * Retrieves what a member of a TypeScript interface states about its values, for comparison: their types and the
 * restrictions on them, their number, and the flags on the member, leaving out how it is labelled and described.
 */
function spelled({
	optional, plural, minCount, maxCount, types, dictionary, managed, foreign, captive
}: ShapeMember): Readonly<Record<string, unknown>> {
	return { optional, plural, minCount, maxCount, types, dictionary, managed, foreign, captive };
}

/**
 * Lists the TypeScript types of the values a shape admits other than localised text, one for each distinct
 * alternative with the restrictions it states, linking the shapes to their documentation.
 */
function scripted(lazy: Lazy<Shape>): readonly ShapeType[] {

	const types: readonly ShapeType[] = branches(lazy).flatMap(shape => shape.kind === "dictionary" ? [] : [{
		...shape.kind === "reference" ? scriptable(eager(shape.target))
			: shape.kind === "resource" ? scriptable(shape)
				: {
					name: shape.kind === "boolean" || shape.kind === "number" ? shape.kind : "string",
					href: undefined
				},
		restrictions: restrictions(shape)
	}]);

	return types.filter((type, index) => types.findIndex(other => equals(other, type)) === index);

}

/**
 * Links a resource shape to its documentation under its TypeScript identifier.
 */
function scriptable(shape: ResourceShape): ShapeLink {
	return { ...linked(shape), name: identifier(shape) };
}

/**
 * Names a resource shape as a TypeScript identifier.
 */
function identifier(shape: ResourceShape): string {
	return getShapeName(shape).replace(/[^\p{L}\p{N}_$]/gu, "");
}

/**
 * Names the type of plain values.
 */
function plain(shape: Exclude<Shape, { readonly kind: "union" | "reference" | "resource" }>): string {
	return shape.kind === "dictionary" ? "Dictionary"
		: shape.kind === "boolean" ? "boolean"
			: shorthand(shape)?.name ?? opt(shape.datatype, local) ?? shape.kind;
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
function summarize(markdown: string): Optional<string> {
	return opt(summary(markdown), collapse);
}

/**
 * Collapses runs of whitespace into single spaces, trimming the ends.
 */
function collapse(text: string): string {
	return text.trim().replace(/\s+/g, " ");
}

/**
 * Retrieves the IRI of a predicate a property maps to, unless it lies in the default namespace a property without an
 * explicit mapping falls back to, where it names no term of a shared vocabulary.
 */
function mapped(iri: Optional<string>): Optional<string> {
	return iri === undefined || iri.startsWith(base[""]) ? undefined : iri;
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
		const name = base !== undefined && peers.length === 1 ? label : `${label} (${peers.indexOf(shape)+1})`;

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
