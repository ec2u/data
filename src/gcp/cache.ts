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
 * @module DatastoreCache
 *
 * Provides Google Cloud Datastore-backed cache implementation for persistent,
 * distributed caching across multiple instances.
 */

import { hash, isObject, isString } from "@/core";
import { Cache } from "@/core/cache";
import { log, message } from "@/core/log";
import { project } from "@/gcp/index";
import { Datastore } from "@google-cloud/datastore";


const datastore=new Datastore({
	projectId: project
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a Google Cloud Datastore-backed cache implementation.
 *
 * Values are stored in Datastore and can be shared across multiple instances.
 * This implementation provides persistence, distribution, and automatic
 * deduplication of concurrent requests for the same key.
 *
 * @template T The type of values to cache
 *
 * @param config Configuration options for the Datastore cache
 * @param config.kind Datastore kind name for cache entries (default: "Cache")
 *
 * @returns A cache instance that persists values to Datastore
 */
export function DatastoreCache<T>({

	kind="Cache"

}: {

	kind?: string;

}={}): Cache<T> {

	const pending=new Map<string, Promise<T>>();

	return {

		async lookup(key: string, generator: (key: string) => Promise<T>): Promise<T> {

			const work=pending.get(key);

			if ( work ) {

				return work;

			} else {

				const promise=new Promise<T>(async (resolve, reject) => {

					try {

						log.info(DatastoreCache.name, `looking up <${key}>`);

						const docId=hash(key);
						const entityKey=datastore.key([kind, docId]);
						const [entity]=await datastore.get(entityKey);

						if ( entity ) {

							if ( entity.value !== undefined ) {
								resolve(entity.value);
							}

						} else {

							const value=await generator(key);

							function excluded(entry: any, prefix=""): string[] {
								return !isObject(entry) ? [] : Object.keys(entry).flatMap(key => {

									const path=prefix ? `${prefix}.${key}` : key;
									const value=entry[key];

									return isString(value) ? [path] : [...excluded(value, path)];
								});
							}

							log.info(DatastoreCache.name, `saving <${key}>`);

							await datastore.save({
								key: entityKey,
								data: {
									key,
									value
								},
								excludeFromIndexes: excluded(value, "value")
							});

							resolve(value);
						}

					} catch ( e ) {

						log.error(DatastoreCache.name, `processing error for <${key}>: ${(message(e))}`);

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
