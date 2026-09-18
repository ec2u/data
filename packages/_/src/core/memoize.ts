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
 * Value memoisation.
 *
 * Provides on-demand value computation with results retained across requests, so that an expensive computation is
 * performed at most once per key and its outcome shared by every caller.
 *
 * @module
 */

/**
 * Creates a memoising value factory.
 *
 * The returned factory computes each value on demand, delegating to `factory` on the first request for a key and
 * yielding the retained value on every later one, so each value is computed at most once and shared by all callers.
 * Keys are matched by same-value-zero equality, as by {@link !Map Map}, so object keys are matched by identity rather
 * than structurally.
 *
 * Values are retained for the lifetime of the returned factory: `undefined` is retained like any other value and
 * distinguished from keys never requested.
 *
 * > [!WARNING]
 * > Retained values are never evicted and their number isn't bounded, so memory use grows with the number of distinct
 * > keys requested.
 *
 * > [!IMPORTANT]
 * > Computations that throw are not retained, so the next request for a failed key retries it; failures surfaced as a
 * > rejected promise are retained like any other value, so every later request for that key gets the same rejection.
 *
 * @typeParam K The type of the keys values are computed for
 * @typeParam V The type of the memoised values
 *
 * @param factory The factory computing the value for a key on its first request
 *
 * @returns A factory yielding the value computed by `factory` for each key, retained for later requests
 *
 * @throws Whatever `factory` throws while computing a requested value
 *
 * @see {@link https://tc39.es/ecma262/#sec-samevaluezero SameValueZero}
 */
export function memoize<K, V>(factory: (key: K) => V): typeof factory {

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
