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

import { Unit } from "@/pipelines/units/index";
import { immutable } from "@/utilities/core";
import { log, message, time } from "@/utilities/core/log";
import { datastore } from "@/utilities/gcp/datatsore";
import { uuid } from "@/utilities/node/uuid";


const kind="Unit";
const batch=100;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const units=immutable({

	async lookup(id: string): Promise<undefined | Unit> {

		return time(async () => {

			const [entity]=await datastore.get(datastore.key([kind, uuid(id)]));

			if ( entity ) {

				const { [datastore.KEY]: _, ...item }=entity;

				return item;

			} else {
				return undefined;
			}

		}, (_, elapsed) => log.info(units.lookup.name,
			`fetched unit <${id}> in <${message(elapsed)}> ms`
		));

	},

	async select({ offset, limit }: {

		readonly offset?: number;
		readonly limit?: number;

	}={}): Promise<readonly Unit[]> {

		return time(async () => {

			let query=datastore.createQuery(kind).order("__key__");

			if ( offset ) {
				query=query.offset(offset);
			}

			if ( limit ) {
				query=query.limit(limit);
			}

			const [entities]=await datastore.runQuery(query);

			return entities.map(({ [datastore.KEY]: _, ...item }) => item);

		}, (value, elapsed) => log.info(units.select.name,
			`retrieved <${message(value.length)}> units in <${message(elapsed)}> ms`
		));

	},

	async insert(items: readonly Unit[]): Promise<readonly Unit[]> {

		return time(async () => {

			for (let i=0; i < items.length; i+=batch) {

				await datastore.upsert(items.slice(i, i+batch).map(item => ({
					key: datastore.key([kind, uuid(item.id)]),
					data: item,
					excludeFromIndexes: ["authoritative", "summary", "description", "keywords"]
				})));
			}

			return items;

		}, (value, elapsed) => log.info(units.insert.name,
			`inserted <${message(value.length)}> units in <${message(elapsed)}> ms`
		));

	},

	async remove(): Promise<void> {

		time(async () => {

			const [items]=await datastore.runQuery(datastore.createQuery(kind).select("__key__"));

			if ( items.length !== 0 ) {
				for (let i=0; i < items.length; i+=batch) {
					await datastore.delete(items.slice(i, i+batch).map(entity => entity[datastore.KEY]));
				}
			}

			return items;

		}, (items, elapsed) => log.info(units.remove.name,
			`removed <${message(items.length)}> units in <${message(elapsed)}> ms`
		));

	}

});
