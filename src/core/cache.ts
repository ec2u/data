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

import { hash } from "@/core/index";
import { existsSync, promises as fs } from "fs";
import { join } from "path";

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
	 * @param generator Function to generate the value if not cached
	 * @returns Promise resolving to the cached or generated value
	 */
	lookup(key: string, generator: (key: string) => Promise<T>): Promise<T>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

		async lookup(key: string, generator: (key: string) => Promise<T>): Promise<T> {

			const cached=cache.get(key);

			if ( cached !== undefined ) {

				return cached;

			} else {

				const value=await generator(key);

				cache.set(key, value);

				return value;

			}
		}

	};
}


/**
 * Creates a persistent disk-based cache implementation.
 *
 * Values are stored as JSON files on disk using key hashes as filenames.
 * This implementation provides persistence across process restarts and
 * includes deduplication of concurrent requests for the same key.
 *
 * @template T The type of values to cache
 *
 * @param config Configuration options for the cache
 * @param config.path Directory path where cache files will be stored (default: ".cache")
 *
 * @returns A cache instance that persists values to disk
 */
export function DiskCache<T>({

	path=".cache"

}: Partial<{

	path: string

}>={}): Cache<T> {

	const pending=new Map<string, Promise<T>>();

	return {

		async lookup(key: string, generator: (key: string) => Promise<T>): Promise<T> {

			const file=join(path, `${(hash(key))}.json`);
			const work=pending.get(key);


			async function cleanup(): Promise<void> {
				try {

					if ( existsSync(file) ) {
						await fs.unlink(file);
					}

				} catch ( e ) {
					const message=e instanceof Error ? e.message : String(e);
					console.error(`unable to remove partial cache file for <${key}> at <${file}>: ${message}`);
				}
			}


			if ( work ) {

				return work;

			} else if ( existsSync(file) ) {

				try {

					return JSON.parse(await fs.readFile(file, "utf8"));

				} catch ( e ) {

					const message=e instanceof Error ? e.message : String(e);
					console.error(`corrupted cache entry for <${key}> at <${file}>: ${message}`);

					throw e;
				}

			} else {

				const promise=new Promise<T>(async (resolve, reject) => {

					try {

						const value=await generator(key);

						try {

							await fs.mkdir(path, { recursive: true });
							await fs.writeFile(file, JSON.stringify(value, null, 2));

							resolve(value);

						} catch ( e ) {

							const message=e instanceof Error ? e.message : String(e);
							console.error(`unable to write cache entry for <${key}> at <${file}>: ${message}`);

							await cleanup();

							reject(e);

						}

					} catch ( e ) {

						const message=e instanceof Error ? e.message : String(e);
						console.error(`unable to generate cache value for <${key}> at <${file}>: ${message}`);

						await cleanup();

						reject(e);

					}
				});

				pending.set(key, promise);

				return promise.finally(() => {
					pending.delete(key);
				});
			}
		}

	};

}
