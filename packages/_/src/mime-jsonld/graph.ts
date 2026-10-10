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

import { validate } from "@metreeca/blue";
import {
	getShapeClass,
	getShapeClasses,
	getShapeId,
	getShapeProperties,
	getShapeType,
	type Property,
	type ResourceShape
} from "@metreeca/blue/resource";
import { getShapeBranches, getStateBranch } from "@metreeca/blue/union";
import { eager, type Shape } from "@metreeca/blue/value";
import { isScalar, isString, type Lazy } from "@metreeca/core";
import { xsd } from "@metreeca/core/datatype";
import { type IRI } from "@metreeca/core/resource";
import type { Task } from "@metreeca/flow";
import { map, trim } from "@metreeca/flow/tasks";
import {
	type Dictionary,
	isDictionary,
	isResource,
	type Resource,
	type Value
} from "@metreeca/qest/state";
import { log } from "@metreeca/tape";
import {
	blank,
	type Blank,
	type Graph,
	named,
	type Named,
	rdf,
	type Term,
	type Typed
} from "@metreeca/trio";
import { data, description, link, property, text } from "@metreeca/trio/builder";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a task encoding JSON-LD resource descriptions as the RDF statements a shape maps them to.
 *
 * Each description is replaced in the stream by the graph describing it, in feed order, ready to be stored or
 * serialised. The shape settles how every member is rendered:
 *
 * - the resource is named by its identifier, or by a fresh blank node where it states none
 * - the resource is typed with the class the shape declares and the classes it inherits, as well as with the value of
 *   a type member, where the shape declares one
 * - each property value yields one statement under the predicate the property maps to, from the resource to the value
 *   for a `forward` mapping and from the value to the resource for a `reverse` one
 * - strings, numbers and booleans become literals of the datatype the value shape states, defaulting to `xsd:string`,
 *   `xsd:double` and `xsd:boolean` respectively
 * - localised text becomes language-tagged literals, plain ones for the `und` tag
 * - references become named resources; embedded resources are described in turn, anchored at a fresh blank node
 * - a value admitted by a union is rendered as the branch it matches
 *
 * `foreign` properties are views over statements another property owns, and are left out, as are members the shape
 * doesn't declare.
 *
 * A description the shape rejects is logged with its violations and dropped. A single malformed resource costs only
 * itself, not the run.
 *
 * @typeParam S The type of the resource shape the descriptions are validated against
 *
 * @param shape The resource shape the descriptions are validated against
 *
 * @returns A task replacing each JSON-LD description `shape` accepts with the RDF graph describing it, and dropping
 *     the others
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if `shape` is malformed
 */
export function graph<S extends Lazy<ResourceShape>>(shape: S): Task<unknown, Graph> {

	return trim(map(value => validate(value, { shape })({

		value: frame => describe(shape, frame, anchor(shape, frame)),

		trace: trace => {

			logger.warn`invalid value (${JSON.stringify(trace)})`;

			return undefined;

		}

	})));

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function anchor(shape: Lazy<Shape>, frame: Resource): Blank | Named {

	const id = getShapeId(shape);
	const identifier = id === undefined ? undefined : frame[id];

	return isString(identifier) ? named(identifier) : blank();

}

function describe(shape: Lazy<Shape>, frame: Resource, subject: Blank | Named): Graph {

	const type = getShapeType(shape);

	const classes = new Set([
		getShapeClass(shape),
		...getShapeClasses(shape) ?? [],
		type === undefined ? undefined : frame[type]
	].filter(isString));

	return description(
		property(subject, rdf.type, [...classes]),
		...Object.entries(getShapeProperties(shape)).map(([field, member]) =>
			member.kind === "property" && !member.foreign
				? [frame[field] ?? []].flat().flatMap(value => object(eager(member.range.shape), value, subject, member))
				: []
		)
	);

}

function statements(subject: Blank | Named, { forward, reverse }: Property, objects: readonly Term[]): Graph {

	return forward !== undefined ? property(subject, forward, objects)
		: reverse !== undefined ? property(objects.filter(object => object.kind === "blank" || object.kind === "named"), reverse, subject)
			: [];

}

function object(shape: Shape, value: Value | Dictionary, subject: Blank | Named, member: Property): Graph {

	switch ( shape.kind ) {

	case "boolean":
		return statements(subject, member, literal(value, xsd.boolean));

	case "number":
		return statements(subject, member, literal(value, shape.datatype ?? xsd.double));

	case "string":
		return statements(subject, member, literal(value, shape.datatype ?? xsd.string));

	case "dictionary":
		return isDictionary(value) ? statements(subject, member, text(value)) : [];

	case "reference":
		return isString(value) ? statements(subject, member, link(value)) : [];

	case "resource": {

		const target = blank();

		return isResource(value) ? description(statements(subject, member, [target]), describe(shape, value, target)) : [];

	}

	case "union": {

		const branch = getStateBranch(value, getShapeBranches(shape));

		return branch === undefined ? [] : object(branch, value, subject, member);

	}

	}

}

function literal(value: Value | Dictionary, datatype: IRI): readonly Typed[] {
	return isScalar(value) ? data(value, datatype) : [];
}
