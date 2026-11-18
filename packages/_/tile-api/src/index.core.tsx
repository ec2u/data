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

import { byte, decimal, double, float, int, integer, long, type NumberShape, short } from "@metreeca/blue/number";
import { type Id, type Member, type ResourceShape, type Type } from "@metreeca/blue/resource";
import {
	date,
	duration,
	email,
	instant,
	iri,
	markdown,
	phone,
	type StringShape,
	tag,
	text,
	time,
	timestamp,
	url,
	year
} from "@metreeca/blue/string";
import { eager, type Shape } from "@metreeca/blue/value";
import { Button } from "@metreeca/clay-widgets/button";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Link } from "@metreeca/clay-widgets/link";
import { isArray, isString, type Lazy, opt, type Optional } from "@metreeca/core";
import { base, type Lexicon } from "@metreeca/core/resource";
import { equals } from "@metreeca/core/values";
import { type ComponentChildren } from "preact";
import { useRef } from "preact/hooks";
import { getDatatype, getDatatypeAnchor } from "./datatypes.core.js";
import { type Endpoints } from "./endpoints.core.js";
import {
	english,
	getOwnMembers,
	getShapeSummary,
	inlined,
	linked,
	markup,
	type Model,
	nameShape,
	prefixed,
	type ShapeLink
} from "./shapes.core.js";
import "./index.css";


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
 * A type of the values of a member, with the restrictions it states on them.
 */
export type ShapeType = ShapeLink & {

	/**
	 * The kind of values the type admits: linked or embedded resources, plain values or localised text.
	 */
	readonly kind: "resource" | "boolean" | "number" | "string" | "dictionary"

	/**
	 * The restrictions the type states on its values beyond the ones implied by the shorthand it was defined with.
	 */
	readonly restrictions: ShapeRestrictions

};

/**
 * The documentation of a member declared by a resource shape: a property, or the member carrying the identifier
 * (`@id`) or the class (`@type`) of the resource, both assigned by the server and stated once per resource; the class
 * member is left out on shapes stating no class, which admit no value for it.
 */
export type ShapeMember = {

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
	 * The names of the members a linked or embedded resource shape documented where it is used, rather than on a page
	 * of its own, declares or narrows in its own right beyond the shapes it extends.
	 */
	readonly members?: readonly string[]

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
 * A constraint on the values of a member, as labelled and spelled out for reading, one entry for each value it lists.
 */
export type Constraint = {

	/**
	 * The name of the constraint, as `pattern` or `languages`.
	 */
	readonly label: string

	/**
	 * The values the constraint states, spelled out for reading; IRIs are abbreviated as prefixed names.
	 */
	readonly values: readonly string[]

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Spells out the constraints a member states: the restrictions of each of its types, stated once where all its types
 * agree on them and prefixed by the type they apply to otherwise, followed by the ones on the member itself.
 */
export function constrain(lexicon: Lexicon, { types, managed, foreign, captive }: {
	readonly types: readonly ShapeType[]
	readonly managed: boolean
	readonly foreign: boolean
	readonly captive: boolean
}): readonly Constraint[] {

	const restricted = types.flatMap(({ name, restrictions }) => restrict(lexicon, restrictions).map(constraint => ({
		...constraint, type: name
	})));

	const labels = [...new Set(restricted.map(({ label }) => label))];

	return [

		...labels.map(label => {

			const matching = restricted.filter(constraint => constraint.label === label);
			const [first] = matching;

			return {
				label, values: first !== undefined && matching.every(({ values }) => equals(values, first.values))
					? first.values
					: matching.flatMap(({ type, values }) => values.map(value => `${type}: ${value}`))
			};

		}),

		...(managed ? [{ label: "read-only", values: ["set by the server"] }] : []),
		...(foreign ? [{ label: "read-only", values: ["set by the linked resources"] }] : []),
		...(captive ? [{ label: "lifecycle", values: ["bound"] }] : [])

	];

}

/**
 * Spells out the number of values a member admits: `1`, `0‥1`, `*`, `1‥*`, or `min‥max` for other bounds, with an
 * open upper bound stated as `*` and the bounds joined by a two dot leader (U+2025) set as a single glyph.
 */
export function bounded(min: number, max: Optional<number>): string {
	return min === 1 && max === 1 ? "1"
		: min === 0 && max === 1 ? "0‥1"
			: min === 0 && max === undefined ? "*"
				: `${min}‥${max ?? "*"}`;
}

/**
 * Describes a member of a resource shape.
 *
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 * @param lexicon The prefixes abbreviating the IRIs of the model
 * @param shape The shape declaring or inheriting the member
 * @param term The name the member is keyed by in resource states
 * @param member The member to be described
 *
 * @returns The documentation of `member`, as stated by `shape`
 */
export function described(
	endpoints: Endpoints,
	lexicon: Lexicon,
	shape: ResourceShape,
	term: string,
	member: Member
): ShapeMember {
	return member.kind === "property" ? {

		term,
		label: english(member.name),
		predicate: mapped(member.forward),
		reverse: mapped(member.reverse),
		types: typed(endpoints, lexicon, member.range.shape),
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
		types: [{
			name: "iri",
			href: undefined,
			kind: "string",
			restrictions: keyed(endpoints, lexicon, shape, member)
		}],
		minCount: 1,
		maxCount: 1,
		description: keyword(member),
		managed: true,
		foreign: false,
		captive: false

	};
}

/**
 * Retrieves the shorthand a plain shape was created with, if any: the one admitting values of the same kind and
 * datatype and, for strings, matching the same pattern.
 */
export function shorthand(shape: Shape): Optional<Shorthand> {
	return shorthands.find(({ shape: base }) => base.kind === "string" && shape.kind === "string"
		? base.datatype === shape.datatype && base.pattern === shape.pattern
		: base.kind === "number" && shape.kind === "number" && base.datatype === shape.datatype
	);
}

/**
 * Lists the alternatives of a shape, looking through unions.
 */
export function branches(lazy: Lazy<Shape>): readonly Exclude<Shape, { readonly kind: "union" }>[] {

	const shape = eager(lazy);

	return shape.kind === "union" ? shape.branches.flatMap(branches) : [shape];

}

/**
 * Sets out a code block, with a button copying its text, as shown, to the clipboard.
 */
export function Code({ children }: { children: ComponentChildren }) {

	const code = useRef<HTMLElement>(null);

	return <pre class={"tile-api-shape-code"}>

		<Button icon={<Icon.Copy/>} title={"Copy"}
			onClick={() => opt(code.current?.textContent ?? undefined, text => navigator.clipboard.writeText(text))}
		/>

		<code ref={code}>{children}</code>

	</pre>;

}

/**
 * Sets out a keyword of a code block.
 */
export function Keyword({ children }: { children: string }) {
	return <span class={"tile-api-shape-keyword"}>{children}</span>;
}

/**
 * Sets out rows as a table under its column headings.
 *
 * The last row sits in a row group of its own: sticky column headings are held within their row group, so they leave
 * as soon as the top of the last row reaches them, whatever its height, and scroll away together with it.
 */
export function Listing({ routes = false, columns, rows }: {

	/**
	 * Whether the table lists API routes, with the model of their resources between them and their descriptions.
	 */
	routes?: boolean

	/**
	 * The column headings.
	 */
	columns: readonly string[]

	/**
	 * The table rows.
	 */
	rows: readonly ComponentChildren[]

}) {
	return <table class={routes ? "tile-api-index tile-api-index-routes" : "tile-api-index"}>

		<tbody>

			<tr class={"tile-api-index-head"}>{columns.map(column => <th key={column}>{column}</th>)}</tr>

			{rows.slice(0, -1)}

		</tbody>

		<tbody>{rows.slice(-1)}</tbody>

	</table>;
}

/**
 * Sets out a list of shapes as a table, each shape linked to its page beside its summary and indented by its depth.
 */
export function Models({ endpoints, lexicon, rows }: {

	/**
	 * The routes served by the API, each mapped to the shape of the resources it serves.
	 */
	endpoints: Endpoints

	/**
	 * The prefixes abbreviating the IRIs of the model.
	 */
	lexicon: Lexicon

	/**
	 * The listed shapes.
	 */
	rows: readonly Model[]

}) {
	return <Listing columns={["shape", "description"]} rows={rows.map(({ path, depth, href, shape }) => <tr key={path}>
		<td>
			<span style={{ "--tile-api-index-depth": depth }}><Link href={href}>{nameShape(shape, lexicon)}</Link></span>
		</td>
		<td>{getShapeSummary(shape)}</td>
	</tr>)}/>;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
function keyed(endpoints: Endpoints, lexicon: Lexicon, shape: ResourceShape, member: Id | Type): ShapeRestrictions {
	return member.kind === "id"
		? restrictions(endpoints, lexicon, shape)
		: opt(shape.class, type => ({ hasValue: [type] })) ?? {};
}

/**
 * Retrieves the restrictions a shape other than a union states beyond the given ones, by default the ones implied by
 * the shorthand it was created with: the ones on plain values, or the ones on the identifiers of linked or embedded
 * resources.
 */
function restrictions(
	endpoints: Endpoints, lexicon: Lexicon,
	shape: Exclude<Shape, { readonly kind: "union" }>,
	given: ShapeRestrictions = opt(shorthand(shape), base => restrictions(endpoints, lexicon, base.shape, {})) ?? {}
): ShapeRestrictions {

	function fresh<K extends keyof ShapeRestrictions>(key: K, value: ShapeRestrictions[K]): ShapeRestrictions {
		return value === undefined || isArray(value) && value.length === 0 || equals(value, given[key])
			? {}
			: { [key]: value };
	}

	return shape.kind === "reference" ? restrictions(endpoints, lexicon, eager(shape.target))

		: shape.kind === "resource" ? {
				...fresh("template", shape.pattern),
				...fresh("members", inlined(endpoints, lexicon, shape) ? Object.keys(getOwnMembers(shape)) : undefined),
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
 * Retrieves the IRI of a predicate a property maps to, unless it lies in the default namespace a property without an
 * explicit mapping falls back to, where it names no term of a shared vocabulary.
 */
function mapped(iri: Optional<string>): Optional<string> {
	return iri === undefined || iri.startsWith(base[""]) ? undefined : iri;
}

/**
 * Retrieves the local name of an IRI, following its last `#` or `/`.
 */
function local(iri: string): string {
	return iri.replace(/^.*[#/]/, "");
}

/**
 * Spells out the restrictions of a type, in a fixed order.
 */
function restrict(lexicon: Lexicon, {
	template, members, pattern, minLength, maxLength, languageIn, uniqueLang, integral,
	minInclusive, minExclusive, maxInclusive, maxExclusive, in: values, hasValue
}: ShapeRestrictions): readonly Constraint[] {

	const entries: readonly (readonly [string, readonly string[]])[] = [
		["id space", opt(template, template => [template]) ?? []],
		["members", members ?? []],
		["pattern", opt(pattern, pattern => [pattern]) ?? []],
		["characters", opt(ranged(minLength, maxLength), range => [range]) ?? []],
		["languages", [...listed(lexicon, languageIn), ...(uniqueLang ? ["one value each"] : [])]],
		["integral", integral ? ["yes"] : []],
		["minimum", opt(minInclusive, value => [`≥ ${value}`]) ?? opt(minExclusive, value => [`> ${value}`]) ?? []],
		["maximum", opt(maxInclusive, value => [`≤ ${value}`]) ?? opt(maxExclusive, value => [`< ${value}`]) ?? []],
		["values", listed(lexicon, values)],
		["value", listed(lexicon, hasValue)]
	];

	return entries.flatMap(([label, values]) => values.length === 0 ? [] : [{ label, values }]);

}

/**
 * Spells out a length range, as `1‥64`, `≥ 1` or `≤ 100`; none if neither bound is stated.
 */
function ranged(min: Optional<number>, max: Optional<number>): Optional<string> {
	return min === undefined ? opt(max, value => `≤ ${value}`)
		: max === undefined ? `≥ ${min}`
			: `${min}‥${max}`;
}

/**
 * Spells out each value of a list, abbreviating IRIs as prefixed names; empty if the list is missing.
 */
function listed(lexicon: Lexicon, values: Optional<readonly (string | number | boolean)[]>): readonly string[] {
	return (values ?? []).map(value => isString(value) ? prefixed(lexicon, value) : String(value));
}

/**
 * Lists the types of the values a shape admits, one for each alternative, with the restrictions each states.
 */
function typed(endpoints: Endpoints, lexicon: Lexicon, lazy: Lazy<Shape>): readonly ShapeType[] {
	return branches(lazy).map((shape): ShapeType => {

		const link = shape.kind === "reference" ? linked(endpoints, lexicon, shape.target)
			: shape.kind === "resource" ? linked(endpoints, lexicon, shape)
				: datatyped(plain(shape));

		return {
			...link,
			kind: shape.kind === "reference" ? "resource" : shape.kind,
			restrictions: restrictions(endpoints, lexicon, shape)
		};

	});
}

/**
 * Links the type of plain values to the entry documenting its datatype on the models index page, if any.
 */
function datatyped(name: string): ShapeLink {
	return { name, href: opt(getDatatype(name), datatype => `./#${getDatatypeAnchor(datatype.name)}`) };
}

/**
 * Names the type of plain values.
 */
function plain(shape: Exclude<Shape, { readonly kind: "union" | "reference" | "resource" }>): string {
	return shape.kind === "dictionary" ? "Dictionary"
		: shape.kind === "boolean" ? "boolean"
			: shorthand(shape)?.name ?? opt(shape.datatype, local) ?? shape.kind;
}
