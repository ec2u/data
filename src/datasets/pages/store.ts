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

/**
 * Persistent web page storage.
 *
 * Provides {@link pages} for retaining {@link Page} snapshots in Google Cloud Datastore across runs, so that pages
 * already processed are reported without being retrieved again, and for discarding them once they go stale. Snapshots
 * are identified by the URL they are stored under, so callers must consistently use its normalised form.
 *
 * Executing this module as a script discards every retained page.
 *
 * @see {@link https://cloud.google.com/nodejs/docs/reference/datastore/latest Google Cloud Datastore}
 *
 * @module
 */

import type { Cache, Page } from "@/datasets/pages/index.js";
import { createCache } from "@/_/core/cache.js";
import { datastore } from "@/_/gcp/datastore.js";
import * as uuid from "uuid";
import { message, time } from "@metreeca/core/report";
import { log } from "@metreeca/tape";


const logger = log(import.meta.url);

const kind = "Page";
const namespace = "99cac6cb-0413-48e5-9882-1a928460cf44";
const batch = 100;


if ( import.meta.main ) {
	await remove();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Datastore operations for retained web pages.
 *
 * Provides page {@link lookup}, retrieving and retaining pages on demand, and {@link remove removal} of retained
 * pages, either selectively or in bulk.
 */
export const pages = Object.freeze({

	lookup,
	remove

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a Datastore-backed page cache.
 *
 * Reports pages retained in Google Cloud Datastore under the requested URL, delegating to `fetcher` and retaining the
 * processed page when the store doesn't already hold one. Lookups are memoised for the lifetime of the returned cache,
 * so that concurrent and repeated requests for the same URL share a single Datastore round trip; failures are memoised
 * as well, so a URL that fails once keeps reporting the same error.
 *
 * @param fetcher The function retrieving and processing pages the store doesn't already hold
 *
 * @returns A {@link Cache} reporting the retained page for a normalised URL, or the page reported by `fetcher` after
 * retaining it; the reported promise is rejected if the page can't be looked up, retrieved, processed or retained
 *
 * @see {@link https://cloud.google.com/nodejs/docs/reference/datastore/latest Google Cloud Datastore}
 */
function lookup(fetcher: (url: string) => Page | Promise<Page>): Cache {

	return createCache(url => new Promise<Page>(async (resolve, reject) => {

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

	}));

}

/**
 * Removes retained pages.
 *
 * Discards the stored snapshots of the given pages, or of every retained page if none is given, so that later lookups
 * retrieve them again, unless already memoised by a live {@link Cache}.
 *
 * @param items The page or pages whose snapshots are to be discarded; if undefined, every retained page is discarded
 *
 * @throws Error If the snapshots can't be discarded
 */
async function remove(items?: Page | readonly Page[]): Promise<void> {

	await time(async () => {

			if ( items ) { // selective removal: delete only the specified items

				const itemsArray = Array.isArray(items) ? items : [items];

				for (let i = 0; i < itemsArray.length; i += batch) {
					const keys = itemsArray.slice(i, i+batch)
						.map(item => datastore.key([kind, uuid.v5(item.url, namespace)]));
					await datastore.delete(keys);
				}

				return itemsArray;

			} else { // remove all: query all keys and delete them

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
