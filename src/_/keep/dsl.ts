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

import type { ResourceShape } from "@metreeca/blue/resource";
import type { Instance } from "@metreeca/blue/value";
import type { Identifier, Lazy, Optional } from "@metreeca/core";
import type { TagRange } from "@metreeca/core/language";
import type { Criteria, Options, Order } from "@metreeca/qest/model";
import type { Dictionary, Literal, Reference, Values } from "@metreeca/qest/state";
import type { Lookup, Select } from "./work.js";


//// Retrieval /////////////////////////////////////////////////////////////////////////////////////////////////////////

export declare function from<S extends Lazy<ResourceShape>, M extends Model>(

	shape: S,
	model: (cursor: Cursor<S>) => M

): Select<Data<M>>;

export declare function from<S extends Lazy<ResourceShape>>(

	shape: S,
	model: Compiled<S>

): Select<Decoded<S>>;

export declare function from<S extends Lazy<ResourceShape>, M extends Model>(

	entry: Reference,
	shape: S,
	model: (cursor: Cursor<S>) => M

): Lookup<Data<M>>;

export declare function from<S extends Lazy<ResourceShape>>(

	entry: Reference,
	shape: S,
	model: Compiled<S>

): Lookup<Decoded<S>>;


//// Models ////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Model = { readonly [alias: Identifier]: Slot }

export type Slot = Field<Optional<Values>> | Model

export declare function where(...criteria: readonly Criterion[]): Criteria;

export declare function as<M extends Model>(model: M, criteria: Criteria): M;

export type Data<M> = { readonly [alias in keyof M]: Valued<M[alias]> }


export declare type Compiled<S extends Lazy<ResourceShape>> = Model & { readonly shape?: S }

export declare type Decoded<S extends Lazy<ResourceShape>> =
	Partial<Instance<S>> & { readonly [alias: Identifier]: Optional<Values> }

export declare function compile<S extends Lazy<ResourceShape>>(shape: S, document: unknown): Compiled<S>;


//// Cursors ///////////////////////////////////////////////////////////////////////////////////////////////////////////

// !!! resolved from `Carried<S>` once per shape and memoised; depth-capped against cyclic shapes
// !!! until then every member stands as a literal, whatever the range its shape declares

export declare type Cursor<S extends Lazy<ResourceShape>> = { readonly [member: Identifier]: Node<Literal> }

// !!! opaque token pairing the wire expression with the type it carries

export declare type Field<V extends Optional<Values>> = { readonly value?: V }

export declare type Node<V extends Optional<Values>> = Field<V> & Cursor<ResourceShape> & {

	select<M extends Model>(model: (cursor: Cursor<ResourceShape>) => M): Field<Data<M>>;
	at<T extends TagRange>(...ranges: readonly T[]): Field<Dictionary>;

}

// !!! the value a slot carries, unwrapping a field and recurring into a nested model

export declare type Valued<S> = S


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
