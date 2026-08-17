/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { Page } from "@/datasets/pages/index.js";
import { datastore } from "@/work/gcp/datastore.js";
import * as uuid from "uuid";
import { message, time } from "@metreeca/core/report";
import { log } from "@metreeca/tape";


const logger = log(import.meta.url);

const kind = "Page";
const namespace = "99cac6cb-0413-48e5-9882-1a928460cf44";
const batch = 100;

const cache = new Map<string, Promise<Page>>();


if ( import.meta.main ) {
	await remove();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const pages = Object.freeze({

	lookup,
	remove

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function lookup(url: string, fetcher: (url: string) => Page | Promise<Page>): Promise<Page> {

	const promise = cache.get(url);

	if ( promise ) { return promise; } else {

		const promise = new Promise<Page>(async (resolve, reject) => {

			try {

				const result = await time(async () => {

					logger.info`looking up <${url}>`;

					const key = datastore.key([kind, uuid.v5(url, namespace)]);
					const [entity] = await datastore.get(key);

					if ( entity ) {

						if ( entity.value !== undefined ) {
							return JSON.parse(entity.value);
						}

					} else {

						const value = await fetcher(url);

						logger.info`caching <${url}>`;

						const data = {
							value: JSON.stringify(value)
						};

						await datastore.save({
							key,
							data,
							excludeFromIndexes: Object.keys(data)
						});

						return value;

					}

				}, (value, elapsed) => value && logger.info`looked up page <${url}> in <${message(elapsed)}> ms`);

				if ( result ) {
					resolve(result);
				}

			} catch ( e ) {

				logger.error`unable to look up <${url}>: ${message(e)}`;

				reject(e);

			}
		});

		cache.set(url, promise);

		return promise;
	}

}

async function remove(items?: Page | readonly Page[]): Promise<void> {

	await time(async () => {

			if ( items ) { // Selective removal: delete only the specified items

				const itemsArray = Array.isArray(items) ? items : [items];

				for (let i = 0; i < itemsArray.length; i += batch) {
					const keys = itemsArray.slice(i, i+batch)
						.map(item => datastore.key([kind, uuid.v5(item.url, namespace)]));
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

		}, (removedItems, elapsed) => {
			logger.info`removed <${message(removedItems.length)}> pages in <${message(elapsed)}> ms`;
		}
	);

}
