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

import type { Awaitable } from "@metreeca/core/async";
import type { Task } from "@metreeca/pipe";


/**
 * A value usable as a grouping key.
 *
 * Enumerates the JavaScript primitive types, the values a `Map` matches by value rather than by reference. Objects,
 * arrays and functions are excluded: two structurally equal ones are distinct keys, so grouping by them would open a
 * new group for every item. Derive a primitive from an object to group by its contents.
 *
 * @remarks
 *
 * Keys are matched with `SameValueZero`, the relation a `Map` uses: `NaN` matches itself and `-0` matches `+0`, while
 * every other primitive matches by value. Note that `symbol` keys, though primitive, are unique by construction, so
 * only the very same symbol ever matches.
 *
 * @see {@link https://tc39.es/ecma262/#sec-primitive-value ECMAScript Primitive Values}
 */
export type Key =
	| undefined
	| null
	| boolean
	| number
	| bigint
	| string
	| symbol;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a task grouping items by a key.
 *
 * Groups are emitted in first-appearance order of their key, with items inside each group in source order.
 *
 * > [!IMPORTANT]
 * >
 * > Grouping keys are limited to the primitive values enumerated by {@link Key} and are matched the way a `Map`
 * > matches them. Objects are rejected: derive a canonical key to group structurally equal objects together.
 *
 * > [!WARNING]
 * >
 * > The whole source is consumed and buffered before the first group is emitted. For large or infinite streams, this
 * > may exhaust memory or never complete.
 *
 * @typeParam V The type of items in the stream
 * @typeParam K The type of the grouping keys extracted by `key`
 *
 * @param key The possibly asynchronous function extracting the grouping key from each item
 *
 * @returns A task pairing each distinct key with the read-only list of the items it grouped
 *
 * @example
 *
 * ```typescript
 * await items([1, 2, 3, 4])(group(n => n%2))(toArray());
 * // [[1, [1, 3]], [0, [2, 4]]]
 * ```
 */
export function group<V, K extends Key>(key: (item: V) => Awaitable<K>): Task<V, readonly [K, readonly V[]]> {

	return async function* (source: AsyncIterable<V>) {

		const groups = new Map<K, V[]>();

		for await (const item of source) {

			const entry = await key(item);

			const values = groups.get(entry) ?? [];

			groups.set(entry, values);

			values.push(item);

		}

		yield* groups;

	};

}
