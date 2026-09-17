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

import type { Id, Property, ResourceShape, Type } from "@metreeca/blue/resource";
import type { Instance, Instance as Plain, Shape } from "@metreeca/blue/value";
import type { Identifier, Lazy, Optional } from "@metreeca/core";
import type { TagRange } from "@metreeca/core/language";
import type { Criteria, Options, Order } from "@metreeca/qest/model";
import type { Dictionary, Literal, Reference, Values } from "@metreeca/qest/state";
import type { Arity, Carried, Target } from "./inference.js";
import type { Lookup, Select } from "./work.js";


//// Retrieval /////////////////////////////////////////////////////////////////////////////////////////////////////////

export declare function from<S extends Lazy<ResourceShape>, M extends Modeller<S>>(

	shape: S,
	model: M

): Select<S, M>;

export declare function from<S extends Lazy<ResourceShape>, M extends Modeller<S>>(

	shape: S,
	entry: Reference,
	model: M

): Lookup<S, M>;


// A model stated against a shape: a traversal starting from its cursor, or a document compiled against it.
// The cursor is the only way to name a member, so a traversal can only reach what the shape carries.

export type Modeller<S extends Lazy<ResourceShape>> =
	| ((cursor: Cursor<S>) => Model)
	| Compiled<S>

// The datum a model retrieves: the traversal it builds, or the shape narrowed by the document it compiled.

export type Datum<S extends Lazy<ResourceShape>, M> =
	M extends (cursor: Cursor<S>) => infer R ? Data<R> : Decoded<S>


//// Models ////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Model = { readonly [alias: Identifier]: Slot }

export type Slot = Field<Optional<Values>> | Model

export declare function where(...criteria: readonly Criterion[]): Criteria;

export declare function as<M extends Model>(model: M, criteria?: Criteria): M;

export type Data<M> = { readonly [alias in keyof M]: Valued<M[alias]> }


export declare type Compiled<S extends Lazy<ResourceShape>> = Model & { readonly shape?: S }

export declare type Decoded<S extends Lazy<ResourceShape>> =
	Partial<Instance<S>> & { readonly [alias: Identifier]: Optional<Values> }

export declare function compile<S extends Lazy<ResourceShape>>(shape: S, document: unknown): Compiled<S>;


//// Cursors ///////////////////////////////////////////////////////////////////////////////////////////////////////////

// Resolved from `Carried<S>`: the shape states which members a cursor offers and what each one carries.

export declare type Cursor<S extends Lazy<ResourceShape>> = {

	readonly [member in keyof Carried<S>]: Noded<Carried<S>[member]>

}

// A member as the cursor offers it: the naming members carry their reference, a property carries its range.

export declare type Noded<P> =
	P extends Id ? Field<Reference>
		: P extends Type ? Field<Optional<Reference>>
			: P extends Property<infer R, infer L, infer U> ? Node<R, L, U>
				: never

// !!! opaque token pairing the wire expression with the type it carries

export declare type Field<V> = { readonly value?: V }

// A property read three ways: as the values it carries, as the members it leads to, and as a nested retrieval.
// The arity rides along, so a collection stays a collection however it is read.

export declare type Node<R extends Lazy<Shape>, L extends Optional<number>, U extends Optional<number>> =
	& Field<Arity<Plain<R>, L, U>>
	& Traversed<R>
	& {

		select<M extends Model>(model: (cursor: Traversed<R>) => M): Field<Arity<Data<M>, L, U>>;
		at<T extends TagRange>(...ranges: readonly T[]): Field<Arity<Dictionary, L, 1>>;

	}

// The members reachable onward, none where the range carries values rather than links.

export declare type Traversed<R extends Lazy<Shape>> =
	Target<R> extends infer T extends Lazy<ResourceShape> ? Cursor<T> : {}

// !!! the value a slot carries, unwrapping a field and recurring into a nested model

export declare type Valued<S> =
	S extends Field<infer V> ? Extract<V, Optional<Values>>
		: S extends Model ? Data<S>
			: never


//// Transforms ////////////////////////////////////////////////////////////////////////////////////////////////////////

export declare function count(values: Field<Optional<Values>>): Field<number>;

export declare function max<V extends Literal>(values: Field<V>): Field<Optional<V>>;

export declare function avg(values: Field<number>): Field<Optional<number>>;

export declare function upper(value: Field<string>): Field<string>;

// !!! the temporal domain has no type of its own yet

export declare function year(value: Field<string>): Field<number>;


//// Criteria //////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Criterion = Entry<Criteria>

export type Entry<T> = { [K in keyof T]-?: readonly [K, Required<T>[K]] }[keyof T]


// !!! `options` constrained by `V`, so that a localised field demands tagged values and a plain one refuses them

export declare function some<V extends Optional<Values>>(field: Field<V>, options: Options): Criterion;

export declare function gte<V extends Literal>(field: Field<V>, bound: V): Criterion;

export declare function order<V extends Optional<Values>>(field: Field<V>, criterion?: Order): Criterion;

export declare function limit(count: number): Criterion;
