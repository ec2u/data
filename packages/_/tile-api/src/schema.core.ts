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

import type { DictionaryShape } from "@grafctory/blue/dictionary";
import type { Property, ResourceShape } from "@grafctory/blue/resource";
import { eager, type Shape } from "@grafctory/blue/value";
import { isString, type Lazy, opt, type Optional } from "@grafctory/core";
import type { Lexicon } from "@grafctory/core/resource";
import { equals } from "@grafctory/core/values";
import { getShapeInterface, scriptable, type ShapeSignature } from "./declaration.core.js";
import type { Endpoints } from "./endpoints.core.js";
import { branches, shorthand } from "./index.core.js";
import { getShapeChecks, getShapeSummary, nameShape, prefixed } from "./shapes.core.js";


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
 * @param endpoints The routes served by the API, each mapped to the shape of the resources it serves
 * @param lexicon The prefixes abbreviating the IRIs of the model
 * @param lazy The shape to be described, possibly deferred
 *
 * @returns The JSON Schema describing the resources of `lazy`
 */
export function getShapeSchema(endpoints: Endpoints, lexicon: Lexicon, lazy: Lazy<ResourceShape>): ShapeSchema {

	const shape = eager(lazy);
	const { parents, members } = getShapeInterface(endpoints, lexicon, shape);

	const required = members.filter(({ optional }) => !optional).map(({ term }) => term);
	const checks = getShapeChecks(shape);

	return {

		title: nameShape(shape, lexicon),

		...opt(getShapeSummary(shape), description => ({ description })),
		...opt(shape.class, type => ({ $comment: prefixed(lexicon, type) })),
		...(checks.length > 0 ? { "x-checks": checks } : {}),

		...(parents.length > 0 ? { allOf: parents.map(({ name, href }) => ({ $ref: href ?? name })) } : {}),

		type: "object",
		properties: Object.fromEntries(members.map(member => [member.term, valued(endpoints, lexicon, shape, member)])),

		...(required.length > 0 ? { required } : {})

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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Describes the values of a member of a TypeScript interface as a JSON Schema, annotated with its label, summary and
 * predicates.
 */
function valued(endpoints: Endpoints, lexicon: Lexicon, shape: ResourceShape, signature: ShapeSignature): ShapeSchema {

	const member = shape.members[signature.term];
	const { label, summary, predicate, reverse } = signature;

	const comment = [
		opt(predicate, iri => prefixed(lexicon, iri)),
		opt(reverse, iri => `^${prefixed(lexicon, iri)}`)
	].filter(isString).join(", ");

	return {

		...opt(label, title => ({ title })),
		...opt(summary, description => ({ description })),
		...(comment !== "" ? { $comment: comment } : {}),

		...(member?.kind === "property" ? spanned(endpoints, lexicon, member, signature) : {
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
function spanned(endpoints: Endpoints, lexicon: Lexicon, {
	range,
	foreign,
	captive
}: Property, { plural }: ShapeSignature): ShapeSchema {

	const alternatives = branches(range.shape);

	const map = opt(alternatives.find(branch => branch.kind === "dictionary"), branch => schematised(endpoints, lexicon, branch));

	const values = alternatives
		.flatMap(branch => branch.kind === "dictionary" ? [] : [schematised(endpoints, lexicon, branch)])
		.filter((value, index, values) => values.findIndex(other => equals(other, value)) === index);

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
function schematised(endpoints: Endpoints, lexicon: Lexicon, shape: Exclude<Shape, {
	readonly kind: "union"
}>): ShapeSchema {
	return shape.kind === "reference" ? linking(endpoints, lexicon, eager(shape.target))
		: shape.kind === "resource" ? linking(endpoints, lexicon, shape)
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
function linking(endpoints: Endpoints, lexicon: Lexicon, shape: ResourceShape): ShapeSchema {

	const { href, name } = scriptable(endpoints, lexicon, shape);

	return {
		$ref: href ?? name,
		...identifying(shape, "x-values"),
		...opt(filled(shape.hasValue), values => ({ "x-value": values }))
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
