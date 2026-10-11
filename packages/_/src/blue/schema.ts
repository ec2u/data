/*
 * Copyright © 2026 Metreeca srl. All rights reserved.
 */

/**
 * JSON Schema conversion.
 *
 * Describes the payloads a {@link resource!ResourceShape | resource shape} admits as a JSON Schema (draft 2020-12), so
 * that schema-driven consumers, such as API descriptions, language model tool interfaces and structured output
 * formats, are declared from the shape already describing the data rather than from a schema restating it by hand.
 * A strict variant targets structured output generators accepting only a subset of JSON Schema.
 *
 * **Converting a shape**
 *
 * Pass a resource shape to {@link schema}:
 *
 * ```typescript
 * import { schema } from '@metreeca/blue/schema';
 * import { id, multiple, required, resource } from '@metreeca/blue/resource';
 * import { string } from '@metreeca/blue/string';
 *
 * const Product = resource({
 *   id: id(),
 *   name: required(string),
 *   tags: multiple(string)
 * });
 *
 * schema(Product);
 *
 * // {
 * //   type: "object",
 * //   properties: {
 * //     name: { type: "string" },
 * //     tags: { type: "array", items: { type: "string" } }
 * //   },
 * //   required: ["name"],
 * //   additionalProperties: false
 * // }
 * ```
 *
 * @module
 *
 * @see {@link https://json-schema.org/draft/2020-12/json-schema-core JSON Schema Core (draft 2020-12)}
 * @see {@link https://json-schema.org/draft/2020-12/json-schema-validation JSON Schema Validation (draft 2020-12)}
 */

import type { Property, ResourceShape } from "@metreeca/blue/resource";
import { date, email, instant, iri, time, timestamp, url } from "@metreeca/blue/string";
import type { Shape } from "@metreeca/blue/value";
import { eager, isString, type Lazy, opt, type Optional } from "@metreeca/core";
import type { Dictionary } from "@metreeca/qest/state";
import type { JSONSchema } from "json-schema-typed";
import { memoize } from "../core/memoize.js";


/**
 * The JSON Schema format each well-known lexical pattern stands for.
 */
const Formats = new Map<Optional<string>, string>([

	[url().pattern, "uri"],
	[iri().pattern, "iri-reference"],
	[email().pattern, "email"],

	[date().pattern, "date"],
	[time().pattern, "time"],

	[instant().pattern, "date-time"],
	[timestamp().pattern, "date-time"]

]);

/**
 * The JSON Schema formats left out of strict schemas.
 */
const Unsupported = new Set([
	"uri",
	"iri-reference"
]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The JSON Schema converted for a shape in each mode, retained for the lifetime of the module (see {@link memoize}).
 */
const schemas = memoize((strict: boolean) => memoize((shape: Lazy<ResourceShape>) =>
	compile(eager(shape), strict)
));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Converts a resource shape into a JSON Schema.
 *
 * A resource is described as an object with one property per member. Like the shape, the object is closed and admits
 * no other property. Members admitting at least one value are required, and a member admitting more than one value is
 * described as an array of its range. Identifier and class members are left out, as they name the resource rather than
 * describe it, so a payload stating them is rejected. A {@link reference!reference | reference} is described as the
 * IRI it carries, an embedded resource as a nested object, and a {@link union!union | union} as the alternatives it
 * admits.
 *
 * Value constraints are carried through: the bounds of a number and whether it is an integer, and the values, length
 * bounds and lexical pattern of a string. A string drawn from a well-known lexical form also carries the matching
 * `format` as an annotation:
 *
 * - {@link string!url | url} as `uri`, {@link string!iri | iri} as `iri-reference`
 * - {@link string!email | email} as `email`
 * - {@link string!date | date} as `date`, {@link string!time | time} as `time`
 * - {@link string!instant | instant} and {@link string!timestamp | timestamp} as `date-time`
 *
 * The pattern remains the constraint values are held to: a validator asserting formats may reject values the shape
 * admits, as a time with no zone offset.
 *
 * The name and description of a resource and of each member are carried as `title` and `description`. A member
 * admitting more than one value annotates the array rather than its items. Localised names and descriptions are
 * carried in English, and left out if stated in no English.
 *
 * A strict schema keeps to the subset of JSON Schema accepted by strict structured output generators. Every member is
 * required. An optional member admitting at most one value also admits `null`, standing for an absent value. A member
 * admitting more than one value is stated as an empty array if absent. A payload generated under a strict schema
 * therefore conforms to the shape only once its `null` members are dropped. IRIs carry no `uri` or `iri-reference`
 * format and are held to their pattern alone.
 *
 * Conversions are cached, so converting the same shape again with the same options returns the same schema at no cost.
 *
 * @param shape The resource shape to convert, possibly deferred
 * @param options The conversion options
 * @param options.strict Whether to produce a strict schema for structured output generators; defaults to `false`
 *
 * @returns The JSON Schema describing the values `shape` admits
 *
 * @throws {@link !RangeError RangeError} If `shape` admits at any depth a {@link dictionary!dictionary | localised}
 *     value range, which a JSON Schema can't describe, as its keys are the language tags each value happens to carry
 *
 * @see {@link https://json-schema.org/draft/2020-12/json-schema-validation#section-7.3 JSON Schema § 7.3 Defined Formats}
 */
export function schema(shape: Lazy<ResourceShape>, {

	strict = false

}: {

	readonly strict?: boolean

} = {}): JSONSchema.Interface {

	return schemas(strict)(shape);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Converts a shape into a JSON Schema.
 *
 * @param shape The shape to describe
 * @param strict Whether to restrict the schema to the strict subset (see {@link schema})
 *
 * @returns The JSON Schema describing the values `shape` admits
 *
 * @throws {@link !RangeError RangeError} If `shape`, or a shape reached from it, admits a localised value range
 */
function compile(shape: Shape, strict: boolean): JSONSchema.Interface {

	switch ( shape.kind ) {

		case "boolean":

			return { type: "boolean" };

		case "number":

			return {

				type: shape.integral ? "integer" : "number",

				...opt(shape.minInclusive, minimum => ({ minimum })),
				...opt(shape.maxInclusive, maximum => ({ maximum }))

			};

		case "string":

			return {

				type: "string",

				...opt(shape.in, values => ({ enum: [...values] })),
				...opt(Formats.get(shape.pattern), format => strict && Unsupported.has(format) ? {} : { format }),
				...opt(shape.pattern, pattern => ({ pattern })),

				...opt(shape.minLength, minLength => ({ minLength })),
				...opt(shape.maxLength, maxLength => ({ maxLength }))

			};

		case "reference":

			return strict ? { type: "string" } : { type: "string", format: "iri-reference" };

		case "resource":

			const properties = Object.entries(shape.members).flatMap(([name, member]) =>
				member.kind === "property" ? [{ name, member }] : []
			);

			const required = properties
				.filter(({ member: { range } }) => strict || (range.minCount ?? 0) > 0)
				.map(({ name }) => name);

			return {

				type: "object",

				...annotate(shape),

				properties: Object.fromEntries(properties.map(({ name, member }) => [name, property(member, strict)])),

				...(required.length > 0 ? { required } : {}),

				additionalProperties: false

			};

		case "union":

			return { anyOf: shape.branches.map(branch => compile(eager(branch), strict)) };

		case "dictionary": // keyed by the language tags a value happens to carry, which a schema has no way to name

			throw new RangeError(`unsupported localised <${shape.kind}> range in JSON Schema`);

	}

}

/**
 * Converts a property member into the JSON Schema of the object property describing it.
 *
 * @param member The property member to describe
 * @param strict Whether to restrict the schema to the strict subset (see {@link schema})
 *
 * @returns The JSON Schema describing the values `member` admits: the schema of its range, or an array of it where
 *          more than one value is admitted, annotated with the name and description of `member`; in strict mode, a
 *          member admitting at most one value and possibly none also admits `null`
 *
 * @throws {@link !RangeError RangeError} If the range of `member`, or a shape reached from it, admits a localised
 *     value range
 */
function property(member: Property, strict: boolean): JSONSchema.Interface {

	const { shape, minCount = 0, maxCount } = member.range;

	const items = compile(eager(shape), strict);

	return {
		...(maxCount !== 1 ? { type: "array", items }
			: strict && minCount === 0 ? { anyOf: [items, { type: "null" }] }
				: items),
		...annotate(member)
	};

}

/**
 * Converts the name and description of a shape or member into schema annotations.
 *
 * @param constraints The name and the description to convert, possibly localised
 *
 * @returns An object carrying the English name as `title` and the English description as `description`, each left out
 *          if undefined or stated in no English
 */
function annotate({ name, description }: {

	readonly name?: string | Dictionary
	readonly description?: string | Dictionary

}): { readonly title?: string, readonly description?: string } {

	return {
		...opt(english(name), title => ({ title })),
		...opt(english(description), text => ({ description: text }))
	};

}

/**
 * Reads a localised text in English.
 *
 * @param text The text to read, either a plain string or localised by language tag
 *
 * @returns The English reading of `text`, with the entries of a multi-valued one joined as paragraphs; undefined if
 *          `text` is undefined or states no English entry
 */
function english(text: Optional<string | Dictionary>): Optional<string> {

	return opt(text, text => isString(text) ? text
		: opt(text.en, entry => isString(entry) ? entry : entry.join("\n\n"))
	);

}
