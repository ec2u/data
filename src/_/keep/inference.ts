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

import type { DictionaryShape } from "@metreeca/blue/dictionary";
import type { ReferenceShape } from "@metreeca/blue/reference";
import type { Id, Members, Parents, Property, ResourceShape, Type } from "@metreeca/blue/resource";
import type { UnionShape } from "@metreeca/blue/union";
import type { Instance as Plain, Shape } from "@metreeca/blue/value";
import type { Eager, Lazy, Optional } from "@metreeca/core";
import type { Criteria } from "@metreeca/qest/model";
import type { Reference } from "@metreeca/qest/state";


// The model chooses the keys and the depth; the shape decides the type, the arity and the optionality.
// Blue keeps its member-level helpers private, so they are restated here rather than imported.


//// Retrieval /////////////////////////////////////////////////////////////////////////////////////////////////////////

// The subset of `S` a model `M` retrieves, keys the shape does not carry dropped rather than typed.

export type Retrieved<S extends Lazy<ResourceShape>, M> =
	Loose<{ readonly [field in keyof Keys<M> & keyof Carried<S>]: Slot<Carried<S>[field], Keys<M>[field]> }>

// A model node states its selection alongside its own criteria: the criteria keys are a known set, so they drop
// without parsing key spellings, which is what made the template-driven rewrite brittle.

export type Keys<M> = Omit<M, keyof Criteria>


//// Slots /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// A member paired with the model node selecting it; the member owns the arity, the node owns the depth.

export type Slot<P, T> =
	P extends Id ? Reference
		: P extends Type ? Optional<Reference>
			: P extends Property<infer R, infer L, infer U> ? Arity<Valued<R, T>, L, U>
				: never

// The value a range carries under a model node, dispatched on the range rather than on the node: a locale and a
// nested template are both identifier-keyed maps of empty objects, so only the shape tells them apart.

export type Valued<R extends Lazy<Shape>, T> =
	[keyof Keys<T>] extends [never] ? Plain<R> // terminal: whatever the range carries on its own
		: Eager<R> extends DictionaryShape ? Tagged<T> // locale: the requested tag ranges, carried whole
			: Eager<R> extends ReferenceShape<infer L> ? Retrieved<L, T> // expanded through the link
				: Eager<R> extends ResourceShape ? Retrieved<R & Lazy<ResourceShape>, T> // nested subset
					: Eager<R> extends UnionShape<infer B> ? Branched<B, T> // one value per branch
						: never

// The resource a range leads to, so a traversal may carry on through a link; `never` where it carries values. A union
// range leads to the resources its branches lead to, and to nothing for the branches carrying values.
//
// !!! a path stops at a union range: `Carried` resolves no member for one, so `event.location.name` is refused even
// !!! where every branch declares `name`. Resolving the member table per branch exceeds the instantiation ceiling on
// !!! shapes of this depth, and would still leave a member only one branch declares unreachable, as the members a
// !!! traversal offers are the ones the branches share. Branches are read one level deep for the same reason: a
// !!! branch that is itself a union leads nowhere rather than being unfolded again.

export type Target<R extends Lazy<Shape>> =
	R extends unknown // distribute over union arms
		? Eager<R> extends UnionShape<infer B> ? Reached<B[number]> : Reached<R>
		: never

export type Reached<R extends Lazy<Shape>> =
	R extends unknown // distribute over branches
		? Eager<R> extends ReferenceShape<infer L> ? L
			: Eager<R> extends ResourceShape ? R & Lazy<ResourceShape>
				: never
		: never


// Localised text is carried whole, so the tag ranges the node lists map to plain strings.

export type Tagged<T> = {

	readonly [range in keyof Keys<T>]: string

}

// A union node keys its branches by position: each branch pairs with the node stated under its own index.

export type Branched<B extends readonly Lazy<Shape>[], T> = {

	readonly [index in keyof B & `${number}`]: Valued<B[index], Keys<T>[index & keyof Keys<T>]>

}[keyof B & `${number}`]


//// Members ///////////////////////////////////////////////////////////////////////////////////////////////////////////

// The members a shape carries, declared over inherited, unflattened: the range survives, so a nested model has
// something to recurse into, which is exactly what blue's own `Retrieved` loses.

// !!! not distributed over union arms: the inheritance merge re-runs per branch and exceeds the instantiation ceiling
// !!! on shapes of this depth, so a range leading to several resources carries no member rather than their common ones

export type Carried<S extends Lazy<ResourceShape>> =
	Eager<S> extends ResourceShape<infer P, infer M> ? Merged<Inherited<P>, M> : {}

export type Inherited<P extends Parents> =
	P extends readonly [infer H extends Lazy<ResourceShape>, ...infer T extends Parents]
		? Settled<Carried<H> & Inherited<T>>
		: {}

export type Settled<M> = {

	readonly [field in keyof M]: M[field] extends { readonly range: never } ? never : M[field]

}

export type Merged<I, M extends Members> = Omit<I, keyof M> & {

	readonly [field in keyof M]: field extends keyof I
		? Outline<M[field]> extends Outline<I[field]> ? M[field] : never
		: M[field]

}

export type Outline<M> =
	M extends Property<infer R, infer L, infer U> ? Arity<Eager<R>["kind"], L, U> : M


//// Cardinality ///////////////////////////////////////////////////////////////////////////////////////////////////////

// A bare value where the range admits at most one, an array otherwise, optional where it may be left out.

export type Arity<V, L extends Optional<number>, U extends Optional<number>> =
	Skippable<L> extends true
		? Optional<[U] extends [1] ? V : readonly V[]>
		: [U] extends [1] ? V : readonly [V, ...V[]]

export type Skippable<L extends Optional<number>> =
	[L] extends [undefined] ? true : [L] extends [0] ? true : false

// Carries the optionality `Arity` states through to the key modifier, so an absent value reads as an absent field.

export type Loose<M> = (
	& { readonly [field in keyof M as undefined extends M[field] ? never : field]: M[field] }
	& { readonly [field in keyof M as undefined extends M[field] ? field : never]?: M[field] }
) extends infer R ? { readonly [field in keyof R]: R[field] } : never
