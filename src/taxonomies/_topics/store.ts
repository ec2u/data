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

import { Topic } from "@/taxonomies/_topics/index.js";
import { compress, decompress } from "@/_/muse/vector.js";
import { datastore } from "@/_/gcp/datastore.js";
import * as uuid from "uuid";
import { PropertyFilter } from "@google-cloud/datastore";
import { isString } from "@metreeca/core";
import { log, report, time } from "@metreeca/tape";


const logger = log(import.meta.url);

const kind = "Topic";
const namespace = "b2cd3750-9a94-4162-b4df-5d5eb6e376a6";
const batch = 100;

const indexed = new Set([

	"id",
	"scheme"

]);


if ( import.meta.main ) {
	await remove();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const topics = Object.freeze({

	lookup,
	select,
	insert,
	remove

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function lookup(key: string | Partial<Topic>): Promise<undefined | Topic> {

	return time(async () => {

		if ( isString(key) ) {

			const [entity] = await datastore.get(datastore.key([kind, uuid.v5(key, namespace)]));

			if ( entity ) {

				const { [datastore.KEY]: _, embedding, ...topic } = entity;

				return {
					...topic,
					embedding: decompress(embedding as string)
				};

			} else {

				return undefined;

			}

		} else {

			if ( !key.id ) {

				return undefined;

			} else if ( key.scheme ) { // If scheme is specified, use it as a filter in the query

				const query = datastore.createQuery(kind)
					.filter(new PropertyFilter("id", "=", key.id))
					.filter(new PropertyFilter("scheme", "=", key.scheme))
					.limit(1);

				const [entities] = await datastore.runQuery(query);

				if ( entities.length === 1 ) {

					const { [datastore.KEY]: _, embedding, ...topic } = entities[0];

					return {
						...topic,
						embedding: decompress(embedding as string)
					};

				} else {

					return undefined;

				}

			} else {// No scheme filter - use direct get by key

				const [entity] = await datastore.get(datastore.key([kind, uuid.v5(key.id, namespace)]));

				if ( entity ) {

					const { [datastore.KEY]: _, embedding, ...topic } = entity;

					return {
						...topic,
						embedding: decompress(embedding as string)
					};

				} else {

					return undefined;

				}

			}

		}

	}, (value, elapsed) => {
		value && logger.info
			`fetched topic <${typeof key === "string" ? key : JSON.stringify(key)}> in <${report(elapsed)}> ms`;
	});

}

async function select({

	scheme

}: {

	scheme?: string

} = {}): Promise<readonly Topic[]> {

	return time(async () => {

			let query = datastore.createQuery(kind).order("__key__");

			if ( scheme ) {
				query = query.filter(new PropertyFilter("scheme", "=", scheme));
			}

			const [entities] = await datastore.runQuery(query);

			return entities.map(({ [datastore.KEY]: _, embedding, ...topic }) => ({
				...topic,
				embedding: decompress(embedding as string)
			}));

		}, (value, elapsed) => {
			logger.info`retrieved <${report(value.length)}> topics${scheme ? ` from <${scheme}>` : ""} in <${report(elapsed)}> ms`;
		}
	);

}

async function insert(items: readonly Topic[]): Promise<readonly Topic[]> {

	return time(async () => {

		for (let i = 0; i < items.length; i += batch) {

			await datastore.upsert(items.slice(i, i+batch).map(({ embedding, ...topic }) => {

				const data = { ...topic, embedding: compress(embedding) };

				return {
					key: datastore.key([kind, uuid.v5(topic.id, namespace)]),
					data,
					excludeFromIndexes: Object.keys(data).filter(field => !indexed.has(field))
				};

			}));
		}

		return items;

	}, (value, elapsed) => {
		logger.info`inserted <${report(value.length)}> topics in <${report(elapsed)}> ms`;
	});

}

async function remove(items?: Topic | readonly Topic[]): Promise<void> {

	await time(async () => {

		if ( items ) { // Selective removal: delete only the specified items

			const itemsArray = Array.isArray(items) ? items : [items];

			for (let i = 0; i < itemsArray.length; i += batch) {
				const keys = itemsArray.slice(i, i+batch)
					.map(item => datastore.key([kind, uuid.v5(item.id, namespace)]));
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
		logger.info`removed <${report(removedItems.length)}> topics in <${report(elapsed)}> ms`;
	});

}
