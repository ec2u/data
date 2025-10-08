/*
 * Copyright © 2025 Metreeca srl
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
 * @module Cache
 *
 * Provides caching implementations for storing and retrieving computed values
 * with string-based keys.
 */

/**
 * A generic cache interface for storing and retrieving values by string key.
 *
 * @template T The type of values stored in the cache
 */
export interface Cache<T> {

	/**
	 * Retrieves a value from the cache or generates it if not present.
	 *
	 * @param key The string key to look up in the cache
	 * @param generator Optional function to generate the value if not cached
	 *
	 * @returns Promise resolving to the cached or generated value
	 *
	 * @throws Error if key not found and no generator provided
	 */
	lookup(key: string, generator?: (key: string) => Promise<T>): Promise<T>;

	/**
	 * Removes cached entries
	 *
	 * @param key Specific key to delete, or omit to clear entire cache
	 *
	 * @returns Promise that resolves when the operation completes
	 */
	delete(key?: string): Promise<void>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a pass-through cache implementation that never stores values.
 *
 * All lookup calls invoke the generator function without caching results.
 * This implementation is useful for testing or when caching should be disabled
 * while maintaining the same interface.
 *
 * @template T The type of values to cache
 *
 * @returns A cache instance that always passes through to the generator
 */
export function DummyCache<T>(): Cache<T> {

	return {

		async lookup(key: string, generator?: (key: string) => Promise<T>): Promise<T> {

			if ( generator ) {

				return await generator(key);

			} else {

				throw new Error(`undefined cache value for <${key}>`);

			}
		},

		async delete(_key?: string): Promise<void> {
			// no-op: nothing to delete
		}

	};
}

/**
 * Creates an in-memory cache implementation.
 *
 * Values are stored in memory and will be lost when the process terminates.
 * This implementation is suitable for short-lived applications or when
 * persistence is not required.
 *
 * @template T The type of values to cache
 *
 * @returns A cache instance that stores values in memory
 */
export function HeapCache<T>(): Cache<T> {

	const cache=new Map<string, T>();

	return {

		async lookup(key: string, generator?: (key: string) => Promise<T>): Promise<T> {

			const cached=cache.get(key);

			if ( cached !== undefined ) {

				return cached;

			} else if ( generator ) {

				const value=await generator(key);

				cache.set(key, value);

				return value;

			} else {

				throw new Error(`undefined cache value for <${key}>`);

			}
		},

		async delete(key?: string): Promise<void> {
			if ( key === undefined ) {
				cache.clear();
			} else {
				cache.delete(key);
			}
		}

	};
}
