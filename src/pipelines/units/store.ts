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

import { normalize as normalizeUrl } from "@/pipelines/pages/index";
import { Unit } from "@/pipelines/units/index";
import { log, message, time } from "@/utilities/core/log";
import { datastore } from "@/utilities/gcp/datatsore";
import { uuid } from "@/utilities/node/uuid";
import { Entity } from "@google-cloud/datastore/build/src/entity";
import { PropertyFilter } from "@google-cloud/datastore/build/src/filter";
import { immutable, isString } from "@metreeca/core";

const kind = "Unit";
const batch = 100;

const indexed = new Set([

	"updated",
	"scraped",
	"scanned",

	"parent",
	"university",

	"formal_",
	"website"

]);



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const units = immutable({

	async lookup(key: string | Partial<Unit>): Promise<undefined | Unit> {

		return time(async () => {

			if ( isString(key) ) {

				const [entity] = await datastore.get(datastore.key([kind, uuid(key)]));

				if ( entity ) {
					return clean(entity);
				} else {
					return undefined;
				}

			} else {

				if ( key.id ) {

					const [entity] = await datastore.get(datastore.key([kind, uuid(key.id)]));

					if ( entity ) {
						return clean(entity);
					}

				}

				if ( key.parent && key.university ) {

					if ( key.website ) {

						const query = datastore.createQuery(kind)
							.filter(new PropertyFilter("website", "=", normalizeUrl(key.website)))
							.filter(new PropertyFilter("parent", "=", key.parent))
							.filter(new PropertyFilter("university", "=", key.university));

						const [entities] = await datastore.runQuery(query);

						if ( entities.length === 1 ) {

							return clean(entities[0]);

						} else if ( entities.length > 1 ) {

							log.warn(units.lookup.name, `multiple matches for <${JSON.stringify({
								parent: key.parent,
								university: key.university,
								website: key.website
							})}>`);

							return undefined;
						}

					}

					if ( key.formal ) {

						const query = datastore.createQuery(kind)
							.filter(new PropertyFilter("formal_", "=", normalizeName(key.formal)))
							.filter(new PropertyFilter("parent", "=", key.parent))
							.filter(new PropertyFilter("university", "=", key.university));

						const [entities] = await datastore.runQuery(query);

						if ( entities.length === 1 ) {

							return clean(entities[0]);

						} else if ( entities.length > 1 ) {

							log.warn(units.lookup.name, `multiple matches for <${JSON.stringify({
								parent: key.parent,
								university: key.university,
								formal: key.formal
							})}>`);

							return undefined;
						}

					}

				}
			}

			return undefined;

		}, (value, elapsed) => value && log.info(units.lookup.name,
			`fetched unit <${typeof key === "string" ? key : JSON.stringify(key)}> in <${message(elapsed)}> ms`
		));

	},

	async select({

		updated,
		scraped,
		scanned,

		offset,
		limit

	}: {

		readonly updated?: number;
		readonly scraped?: number;
		readonly scanned?: number;

		readonly offset?: number;
		readonly limit?: number;

	} = {}): Promise<readonly Unit[]> {

		return time(async () => {

			let query = datastore.createQuery(kind);

			if ( updated === 0 ) { // unprocessed units

				query = query
					.filter(new PropertyFilter("updated", "=", 0))
					.order("updated");

			} else if ( updated ) {

				query = query
					.filter(updated > 0
						? new PropertyFilter("updated", ">=", updated) // current units
						: new PropertyFilter("updated", "<=", -updated) // deleted units
					)
					.order("updated");

			} else {

				query = query.order("__key__");

			}

			if ( scraped === 0 ) {

				query = query
					.filter(new PropertyFilter("scraped", "=", 0))
					.order("scraped");

			} else if ( scraped ) {

				query = query
					.filter(new PropertyFilter("scraped", ">=", scraped))
					.order("scraped");

			}

			if ( scanned === 0 ) {

				query = query
					.filter(new PropertyFilter("scanned", "=", 0))
					.order("scanned");

			} else if ( scanned ) {

				query = query
					.filter(new PropertyFilter("scanned", ">=", scanned))
					.order("scanned");

			}

			if ( offset ) {
				query = query.offset(offset);
			}

			if ( limit ) {
				query = query.limit(limit);
			}

			const [entities] = await datastore.runQuery(query);

			return entities.map(clean);

		}, (value, elapsed) => log.info(units.select.name,
			`retrieved <${message(value.length)}> units in <${message(elapsed)}> ms`
		));

	},

	async insert(items: Unit | readonly Unit[]): Promise<readonly Unit[]> {

		return time(async () => {

			const itemsArray = Array.isArray(items) ? items : [items];

			for (let i = 0; i < itemsArray.length; i += batch) {
				await datastore.upsert(itemsArray.slice(i, i+batch).map(item => {

					const data = {
						...item,
						updated: item.updated ?? 0,
						scraped: item.scraped ?? 0,
						scanned: item.scanned ?? 0,
						formal_: item.formal && normalizeName(item.formal),
						profile: item.profile && normalizeUrl(item.profile),
						website: item.website && normalizeUrl(item.website)
					};

					return {
						key: datastore.key([kind, uuid(item.id)]),
						data,
						excludeFromIndexes: Object.keys(data).filter(field => !indexed.has(field))
					};

				}));
			}

			return itemsArray;

		}, (value, elapsed) => log.info(units.insert.name,
			`inserted <${message(value.length)}> units in <${message(elapsed)}> ms`
		));

	},

	async remove(): Promise<void> {

		time(async () => {

			const [items] = await datastore.runQuery(datastore.createQuery(kind).select("__key__"));

			if ( items.length !== 0 ) {
				for (let i = 0; i < items.length; i += batch) {
					await datastore.delete(items.slice(i, i+batch).map(entity => entity[datastore.KEY]));
				}
			}

			return items;

		}, (items, elapsed) => log.info(units.remove.name,
			`removed <${message(items.length)}> units in <${message(elapsed)}> ms`
		));

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Cleans a Datastore entity by removing internal fields.
 *
 * Strips the Datastore key and normalized label fields from an entity,
 * returning a clean Unit object suitable for public API responses.
 *
 * @param entity - The Datastore entity to clean
 *
 * @returns A Unit object with internal fields removed
 */
function clean(entity: Entity): Unit {

	const { [datastore.KEY]: _, formal_, ...item } = entity;

	return item;
}

/**
 * Normalizes a unit name label for duplicate detection and matching.
 *
 * Creates a canonical form by removing diacritical marks, normalizing whitespace,
 * and converting to uppercase to enable case-insensitive and accent-insensitive comparisons.
 *
 * @param name - The unit name to normalize
 *
 * @returns The normalized name with diacritics removed, whitespace normalized, and uppercase letters
 *
 * @example
 * label("École Polytechnique")  // "ECOLE POLYTECHNIQUE"
 * label("Bio-Chemistry & Physics")  // "BIO CHEMISTRY PHYSICS"
 * label("Computer   Science")  // "COMPUTER SCIENCE"
 */
function normalizeName(name: string): string {
	return name
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.toUpperCase()
		.trim();
}
