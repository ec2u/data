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

import { hash, isObject } from "@/core";
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
 * @param kind Datastore kind name for cache entries (default: "Cache")
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

		async lookup(key: string, generator?: (key: string) => Promise<T>): Promise<T> {

			const work=pending.get(key);

			if ( work ) {

				return work;

			} else {

				const promise=new Promise<T>(async (resolve, reject) => {

					try {

						log.info(DatastoreCache.name, `looking up <${kind} @ ${key}>`);

						const entityKey=datastore.key([kind, hash(key)]);
						const [entity]=await datastore.get(entityKey);

						if ( entity ) {

							if ( entity.value !== undefined ) {
								resolve(entity.value);
							}

						} else if ( generator ) {

							const value=await generator(key);

							function excluded(entry: unknown, path: string): string[] {
								return !isObject(entry) ? [path] : Object.keys(entry).flatMap(field =>
									[path, ...excluded(entry[field], path ? `${path}.${field}` : field)]
								);
							}

							log.info(DatastoreCache.name, `caching <${kind} @ ${key}>`);

							await datastore.save({
								key: entityKey,
								data: {
									key,
									value
								},
								excludeFromIndexes: excluded(value, "value")
							});

							resolve(value);

						} else {

							reject(new Error(`undefined cache value for <${kind} @ ${key}>`));

						}

					} catch ( e ) {

						log.error(DatastoreCache.name, `unable to look up <${kind} @ ${key}>: ${(message(e))}`);

						reject(e);

					}
				});

				pending.set(key, promise);

				return promise.finally(() => {
					pending.delete(key);
				});
			}
		},

		async delete(key?: string): Promise<void> {
			if ( key === undefined ) {

				try {

					log.info(DatastoreCache.name, `deleting <${kind} @ *>`);

					const [entities]=await datastore.runQuery(datastore.createQuery(kind).select("__key__"));

					if ( entities.length === 0 ) {

						log.info(DatastoreCache.name, `no cache entries found for kind <${kind}>`);

					} else {

						const keys=entities.map(entity => entity[datastore.KEY]);

						const batchSize=500; // delete in batches of 500 (Datastore limit)

						for (let i=0; i < keys.length; i+=batchSize) {
							await datastore.delete(keys.slice(i, i + batchSize));
						}

					}
				} catch ( e ) {

					log.error(DatastoreCache.name, `unable to delete <${kind} @ *>: ${message(e)}`);

					throw e;
				}

			} else {

				log.info(DatastoreCache.name, `deleting <${kind} @ ${key}>`);

				const docId=hash(key);
				const entityKey=datastore.key([kind, docId]);

				try {

					await datastore.delete(entityKey);

				} catch ( e ) {

					log.error(DatastoreCache.name, `unable to delete <${kind} @ ${key}>: ${message(e)}`);

					throw e;

				} finally {

					pending.delete(key);

				}

			}
		}

	};

}
