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
import type { Instance as Plain, Shape } from "@metreeca/blue/value";
import type { Identifier, Lazy, Optional } from "@metreeca/core";
import type { TagRange } from "@metreeca/core/language";
import type { Criteria, Options, Order } from "@metreeca/qest/model";
import type { Dictionary, Literal, Reference, Values } from "@metreeca/qest/state";
import type { Arity, Carried, Skippable, Target } from "./inference.js";
import type { Lookup, Select } from "./work.js";


//// Retrieval /////////////////////////////////////////////////////////////////////////////////////////////////////////

export declare function from<S extends Lazy<ResourceShape>, M extends Model<S>>(

	shape: S,
	model: M

): Select<S, M>;

export declare function from<S extends Lazy<ResourceShape>, M extends Model<S>>(

	shape: S,
	entry: Reference,
	model: M

): Lookup<S, M>;


/**
 * A retrieval a shape admits.
 *
 * States what a call site may ask of a shape, as the dual of {@link @metreeca/blue/value!Instance | Instance}, which
 * states what the shape yields: a caller writes a `Model` and reads back a {@link Delivery}, and the shape decides
 * what either may contain.
 * A model takes either form the surface accepts, a traversal composed against the shape's {@link Cursor}, or a
 * document {@link compile | compiled} against the shape.
 *
 * A traversal is held to the shape where it is written, since the cursor offers no member the shape does not carry.
 * A compiled document is held to it where it is decoded, so a document naming an undeclared member is refused at run
 * time rather than at the call site.
 *
 * @typeParam S The shape the retrieval is stated against, possibly deferred to break definition cycles
 *
 * @remarks
 *
 * Stated as the two forms a model is written in rather than as the retrievals the shape admits. Defining it
 * structurally, as a template narrowed to the members the shape carries, would hold a compiled document to the shape
 * at the call site as well and would let {@link Delivery} read a single well-formed model rather than tell the two
 * forms apart.
 *
 * @see {@link Delivery} for what a model of this shape hands back
 */
export type Model<S extends Lazy<ResourceShape>> =
	| ((cursor: Cursor<S>) => Slots)
	| Compiled<S>

/**
 * What a retrieval hands back.
 *
 * Resolves the data a call site reads for a given shape and model, so that it is never wider than what the caller
 * asked for and never wider than what the shape declares. A traversal yields the fields it named, each carrying the
 * type the shape resolved for it; a compiled document yields the shape narrowed to the fields the document may state,
 * leaving a binding untyped, as the expression behind it is known only at run time.
 *
 * @typeParam S The shape the retrieval was stated against, possibly deferred to break definition cycles
 * @typeParam M The retrieval stated against it
 *
 * @see {@link Model} for the retrievals a shape admits
 */
export type Delivery<S extends Lazy<ResourceShape>, M> =
	M extends (cursor: Cursor<S>) => infer R ? Data<R> : Decoded<S>


//// Slots ////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Slots = { readonly [alias: Identifier]: Slot }

export type Slot = Field<Optional<Values>> | Slots

export declare function where(...criteria: readonly Criterion[]): Criteria;

// A model states one datum per resource, or one row per combination of the values it binds, and the two are never
// mixed. A resource names the properties it retrieves, so every slot stands for a member the shape declares; a row
// names expressions, so a slot may reach through a link or apply a transform. `as` states a resource, `by` states a
// row, and a slot admitted by one is not admitted by the other.

export declare function as<M extends Stateable<M>>(model: M, criteria?: Criteria): M & Stated;

export declare function by<M extends Slots>(model: M, criteria?: Criteria): M & Grouped;

// Branded on a symbol key, as a string one would land in the alias space a model states its slots under.

declare const stated: unique symbol;
declare const grouped: unique symbol;
declare const expressed: unique symbol;

export declare type Stated = { readonly [stated]?: never }

export declare type Grouped = { readonly [grouped]?: never }

// A slot computed rather than named: a member reached through a link, or a value a transform derived. Both are
// bindings, which a row admits and a resource does not.

export declare type Expressed = { readonly [expressed]?: never }

export type Expression<D extends boolean> = D extends true ? Expressed : unknown

// A resource retrieves the properties it names, so a computed slot resolves to `never` and the model is refused where
// it is written.

export type Stateable<M> = {

	readonly [alias in keyof M]: M[alias] extends Expressed ? never : Slot

}

// What a model retrieves, slot by slot. A row holds one value per binding, so a multi-valued binding contributes one
// of its values per row; a resource keeps the value set whole. Absence is preserved either way, as a link the
// resource does not state binds no value.

export type Data<M> =
	M extends Grouped
		? { readonly [alias in keyof M]: Single<Valued<M[alias]>> }
		: { readonly [alias in keyof M]: Valued<M[alias]> }

export type Single<V> = V extends readonly (infer E)[] ? E : V


export declare type Compiled<S extends Lazy<ResourceShape>> = Slots & { readonly shape?: S }

export declare type Decoded<S extends Lazy<ResourceShape>> =
	Partial<Plain<S>> & { readonly [alias: Identifier]: Optional<Values> }

export declare function compile<S extends Lazy<ResourceShape>>(shape: S, document: unknown): Compiled<S>;


//// Cursors ///////////////////////////////////////////////////////////////////////////////////////////////////////////

// Resolved from `Carried<S>`: the shape states which members a cursor offers and what each one carries. `L` and `U`
// state the arity of the path already walked, so a member reached through it carries the arity of the whole path and
// not of its own declaration alone.

export declare type Cursor<
	S extends Lazy<ResourceShape>,
	L extends Optional<number> = 1,
	U extends Optional<number> = 1,
	D extends boolean = false
> = {

	readonly [member in keyof Carried<S>]: Noded<Carried<S>[member], L, U, D>

}

// A member as the cursor offers it: the naming members carry their reference, a property carries its range. `D` marks
// a member reached through a link, which is a binding rather than a property the enclosing resource names.

export declare type Noded<P, L extends Optional<number>, U extends Optional<number>, D extends boolean> =
	P extends Id ? Field<Arity<Reference, L, U>> & Expression<D>
		: P extends Type ? Field<Arity<Optional<Reference>, L, U>> & Expression<D>
			: P extends Property<infer R, infer PL, infer PU> ? Node<R, Least<L, PL>, Most<U, PU>, D>
				: never

// The arity of two steps walked in sequence: the values are optional where either step admits none, and stay single
// only where both do.

export declare type Least<L extends Optional<number>, PL extends Optional<number>> =
	Skippable<L> extends true ? 0 : Skippable<PL> extends true ? 0 : 1

export declare type Most<U extends Optional<number>, PU extends Optional<number>> =
	[U] extends [1] ? [PU] extends [1] ? 1 : undefined : undefined

// !!! opaque token pairing the wire expression with the type it carries

export declare type Field<V> = { readonly value: V }

// A property read three ways: as the values it carries, as the members it leads to, and as a nested retrieval.
// The arity rides along, so a collection stays a collection however it is read.

export declare type Node<
	R extends Lazy<Shape>,
	L extends Optional<number>,
	U extends Optional<number>,
	D extends boolean
> =
	& Field<Arity<Plain<R>, L, U>>
	& Expression<D>
	& Traversed<R, L, U>
	& {

		select<M extends Slots>(model: (cursor: Cursor<Linked<R>>) => M): Field<Arity<Data<M>, L, U>> & Expression<D>;
		at<T extends TagRange>(...ranges: readonly T[]): Field<Arity<Dictionary, L, 1>> & Expression<D>;

	}

// The members reachable onward, none where the range carries values rather than links. Reaching one is a traversal,
// so whatever it offers is a binding whether or not the member it started from was.

export declare type Traversed<R extends Lazy<Shape>, L extends Optional<number>, U extends Optional<number>> =
	Target<R> extends infer T extends Lazy<ResourceShape> ? Cursor<T, L, U, true> : {}

// The resource a link leads to, as a nested retrieval states it: the arity and the traversal both start over, since
// the nested model names the linked resource's own properties.

export declare type Linked<R extends Lazy<Shape>> =
	Target<R> extends infer T extends Lazy<ResourceShape> ? T : never

// !!! the value a slot carries, unwrapping a field and recurring into a nested model

export declare type Valued<S> =
	S extends Field<infer V> ? Extract<V, Optional<Values>>
		: S extends Slots ? Data<S>
			: never


//// Transforms ////////////////////////////////////////////////////////////////////////////////////////////////////////

// A transform derives a value rather than naming a property, so what it yields is a binding a row admits and a
// resource does not.

export declare function count(values: Field<Optional<Values>>): Field<number> & Expressed;

export declare function max<V extends Literal>(values: Field<V>): Field<Optional<V>> & Expressed;

export declare function avg(values: Field<number>): Field<Optional<number>> & Expressed;

export declare function upper(value: Field<string>): Field<string> & Expressed;

// !!! the temporal domain has no type of its own yet

export declare function year(value: Field<string>): Field<number> & Expressed;


//// Criteria //////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Criterion = Entry<Criteria>

export type Entry<T> = { [K in keyof T]-?: readonly [K, Required<T>[K]] }[keyof T]


// !!! `options` constrained by `V`, so that a localised field demands tagged values and a plain one refuses them

export declare function some<V extends Optional<Values>>(field: Field<V>, options: Options): Criterion;

export declare function gte<V extends Literal>(field: Field<V>, bound: V): Criterion;

export declare function order<V extends Optional<Values>>(field: Field<V>, criterion?: Order): Criterion;

export declare function limit(count: number): Criterion;
