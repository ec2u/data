/*
 * Copyright © 2020-2025 EC2U Alliance
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
 * distributed caching across multiple instances with promise stampede prevention.
 */

import { Page } from "@/pipelines/pages/index";
import { datastore } from "@/utilities/gcp/datatsore";
import { uuid } from "@/utilities/node/uuid";
import { immutable } from "@metreeca/core";

import { log } from "@metreeca/post";
import { message, time } from "@metreeca/post/tools";


const logger = log(import.meta.url);

const kind="Page";
const batch=100;

const cache=new Map<string, Promise<Page>>();


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const pages=immutable({

	async lookup(url: string, fetcher: (url: string) => Page | Promise<Page>): Promise<Page> {

		const promise=cache.get(url);

		if ( promise ) { return promise; } else {

			const promise=new Promise<Page>(async (resolve, reject) => {

				try {

					logger.info`looking up <${url}>`;

					const key=datastore.key([kind, uuid(url)]);
					const [entity]=await datastore.get(key);

					if ( entity ) {

						if ( entity.value !== undefined ) {
							resolve(JSON.parse(entity.value));
						}

					} else {

						const value=await fetcher(url);

						logger.info`caching <${url}>`;

						const data={
							value: JSON.stringify(value)
						};

						await datastore.save({
							key,
							data,
							excludeFromIndexes: Object.keys(data)
						});

						resolve(value);

					}

				} catch ( e ) {

					logger.error`unable to look up <${url}>: ${message(e)}`;

					reject(e);

				}
			});

			cache.set(url, promise);

			return promise;
		}

	},

	async remove(items?: Page | readonly Page[]): Promise<void> {

		await time(async () => {

			if ( items ) { // Selective removal: delete only the specified items

				const itemsArray = Array.isArray(items) ? items : [items];

				for (let i = 0; i < itemsArray.length; i += batch) {
					const keys = itemsArray.slice(i, i+batch).map(item => datastore.key([kind, uuid(item.url)]));
					await datastore.delete(keys);
				}

				return itemsArray;

			} else { // Remove all: query all keys and delete them

				const [entities] = await datastore.runQuery(datastore.createQuery(kind).select("__key__"));

				if ( entities.length !== 0 ) {
					for (let i = 0; i < entities.length; i += batch) {
						await datastore.delete(entities.slice(i, i+batch).map(entity => entity[datastore.KEY]));
					}
				}

				return entities;

			}

			}, (removedItems, elapsed) => logger.info
			`removed <${message(removedItems.length)}> pages in <${message(elapsed)}> ms`
		);

	}

});
