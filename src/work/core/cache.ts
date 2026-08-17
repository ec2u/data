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

/**
 * Lazy value caching.
 *
 * Provides {@link createCache} for deriving a memoising factory from a plain {@link Factory}, computing each value on
 * first request and reporting the same instance on every later request for the same key.
 *
 * @module
 */

/**
 * Factory computing the value associated with a key.
 *
 * @typeParam K The type of the keys values are computed for
 * @typeParam V The type of the computed values
 *
 * @param key The key to compute a value for
 *
 * @returns The value associated with `key`
 */
export type Factory<K, V> = (key: K) => V


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a memoising value factory.
 *
 * The returned factory computes each value on demand, delegating to `factory` on the first request for a key and
 * reporting the retained value on every later one, so each value is computed at most once and shared by all callers.
 * Keys are matched by same-value-zero equality, as by `Map`, so object keys are matched by identity rather than
 * structurally.
 *
 * Values are retained for the lifetime of the returned factory, with no eviction or size bound, so the cache grows
 * with the number of distinct keys requested. `undefined` values are retained like any other and distinguished from
 * keys never requested; failed computations are not retained, so the next request for a failed key retries it.
 *
 * @typeParam K The type of the keys values are computed for
 * @typeParam V The type of the cached values
 *
 * @param factory The factory computing the value for a key on its first request
 *
 * @returns A factory reporting the value computed by `factory` for each key, retained for later requests
 *
 * @throws Whatever `factory` throws while computing a requested value
 *
 * @see {@link https://tc39.es/ecma262/#sec-samevaluezero SameValueZero}
 */
export function createCache<K, V>(factory: Factory<K, V>): Factory<K, V> {

	const entries = new Map<K, { readonly value: V }>();

	return key => {

		const entry = entries.get(key);

		if ( entry ) {

			return entry.value;

		} else {

			const value = factory(key);

			entries.set(key, { value });

			return value;

		}

	};

}
