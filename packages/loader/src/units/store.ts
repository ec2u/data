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

import { Unit } from "./_index.js";
import { Datastore, Entity, PropertyFilter } from "@google-cloud/datastore";
import { isString } from "@metreeca/core";
import { log, report, time } from "@metreeca/tape";
import * as uuid from "uuid";


/**
 * Minimum token length for fuzzy matching.
 * Filters out short function words (articles, prepositions, conjunctions) across languages.
 */
const FuzzyTokenThreshold = 3;

/**
 * Jaccard similarity threshold for fuzzy name matching (0=none, 1=identical).
 * Handles minor LLM-generated variations in formal names.
 */
const FuzzyMatchThreshold = 0.95;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const logger = log(import.meta.url);
const datastore = new Datastore();


const kind = "Unit";
const namespace = "75c5f4e5-09c3-46a8-9912-e212087e803d";
const batch = 100;

const indexed = new Set([

	"updated",
	"analyzed",
	"expanded",

	"parent",
	"university",

	"website",
	"signature"

]);


if ( import.meta.main ) {
	await remove();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Datastore operations for managing academic units.
 *
 * Provides CRUD operations for unit persistence in Google Cloud Datastore,
 * including lookup by ID or properties, filtered selection, upsert, and removal.
 */
export const _units = Object.freeze({

	lookup,
	select,
	insert,
	remove

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Looks up a unit in the datastore by ID or matching properties.
 *
 * Supports multiple lookup strategies:
 *
 * - By ID string: Direct key-based retrieval
 * - By partial properties: Query-based matching using `website`, `formal`, `parent`, and `university`
 *
 * When querying by properties, returns `undefined` if multiple matches are found to avoid ambiguity. `website` is
 * matched verbatim, so URLs must be supplied in the same form they were stored under.
 *
 * @param key Unit ID string or partial unit properties for matching
 *
 * @returns The matched unit, or `undefined` if not found or ambiguous
 */
async function lookup(key: string | Partial<Unit>): Promise<undefined | Unit> {

	return time(async () => {

		if ( isString(key) ) {

			const [entity] = await datastore.get(datastore.key([kind, uuid.v5(key, namespace)]));

			if ( entity ) {
				return clean(entity);
			} else {
				return undefined;
			}

		} else {

			if ( key.id ) {

				const [entity] = await datastore.get(datastore.key([kind, uuid.v5(key.id, namespace)]));

				if ( entity ) {
					return clean(entity);
				}

			}

			if ( key.parent && key.university ) {

				if ( key.website ) {

					const query = datastore.createQuery(kind)
						.filter(new PropertyFilter("website", "=", key.website))
						.filter(new PropertyFilter("parent", "=", key.parent))
						.filter(new PropertyFilter("university", "=", key.university));

					const [entities] = await datastore.runQuery(query);

					if ( entities.length === 1 ) {

						return clean(entities[0]);

					} else if ( entities.length > 1 ) {

						logger.warning`multiple matches for <${JSON.stringify({
							parent: key.parent,
							university: key.university,
							website: key.website
						})}>`;

						return undefined;
					}

				}

				if ( key.formal ) {

					const tokens = tokenize(key.formal);

					const query = datastore.createQuery(kind)
						.filter(new PropertyFilter("signature", "=", signature(tokens)))
						.filter(new PropertyFilter("parent", "=", key.parent))
						.filter(new PropertyFilter("university", "=", key.university));

					const [entities] = await datastore.runQuery(query);

					if ( entities.length === 1 ) {

						return clean(entities[0]);

					} else if ( entities.length > 1 ) {

						logger.warning`multiple matches for <${JSON.stringify({
							parent: key.parent,
							university: key.university,
							formal: key.formal
						})}>`;

						return undefined;

					} else {

						// Fuzzy matching fallback: no exact signature match found
						// Query all units with same parent/university and compute similarity

						const fallbackQuery = datastore.createQuery(kind)
							.filter(new PropertyFilter("parent", "=", key.parent))
							.filter(new PropertyFilter("university", "=", key.university));

						const [candidates] = await datastore.runQuery(fallbackQuery);

						const matches = candidates
							.filter(candidate => candidate.formal) // Only consider units with formal names
							.map(candidate => ({
								entity: candidate,
								tokens: tokenize(candidate.formal as string),
								similarity: 0
							}))
							.map(item => ({
								...item,
								similarity: jaccard(tokens, item.tokens)
							}))
							.filter(item => item.similarity >= FuzzyMatchThreshold);

						if ( matches.length === 1 ) {

							logger.info`fuzzy match for <${JSON.stringify({
								parent: key.parent,
								university: key.university,
								formal: key.formal,
								matched: matches[0].entity.formal,
								similarity: matches[0].similarity
							})}>`;

							return clean(matches[0].entity);

						} else if ( matches.length > 1 ) {

							logger.warning`multiple fuzzy matches for <${JSON.stringify({
								parent: key.parent,
								university: key.university,
								formal: key.formal,
								matches: matches.map(m => ({ formal: m.entity.formal, similarity: m.similarity }))
							})}>`;

							return undefined;
						}

					}

				}

			}
		}

		return undefined;

	}, (value, elapsed) => {
		value && logger.info
			`fetched unit <${typeof key === "string" ? key : JSON.stringify(key)}> in <${report(elapsed)}> ms`;
	});

}

/**
 * Selects units from the datastore based on processing state and filters.
 *
 * Filtering by processing timestamps:
 *
 * - `0`: Exact match (unprocessed items)
 * - Positive value: Greater than or equal (current items)
 * - Negative value: Less than or equal to absolute value (deleted items)
 *
 * Results are ordered by the primary filter field, or by `__key__` if no filters are specified.
 *
 * @param updated Filter by update timestamp
 * @param analyzed Filter by analysis timestamp
 * @param expanded Filter by expansion timestamp
 * @param university Filter by university identifier
 * @param offset Number of results to skip for pagination
 * @param limit Maximum number of results to return
 *
 * @returns Array of units matching the specified criteria
 */
async function select({

	updated,
	analyzed,
	expanded,

	university,

	offset,
	limit

}: {

	readonly updated?: number;
	readonly analyzed?: number;
	readonly expanded?: number;

	readonly university?: string;

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

			}

			if ( analyzed === 0 ) {

				query = query
					.filter(new PropertyFilter("analyzed", "=", 0));

				if ( updated === undefined ) {
					query = query.order("analyzed");
				}

			} else if ( analyzed ) {

				query = query
					.filter(new PropertyFilter("analyzed", "<=", analyzed));

				if ( updated === undefined ) {
					query = query.order("analyzed");
				}

			}

			if ( expanded === 0 ) {

				query = query
					.filter(new PropertyFilter("expanded", "=", 0));

				if ( updated === undefined && analyzed === undefined ) {
					query = query.order("expanded");
				}

			} else if ( expanded ) {

				query = query
					.filter(new PropertyFilter("expanded", "<=", expanded));

				if ( updated === undefined && analyzed === undefined ) {
					query = query.order("expanded");
				}

			}

			if ( university ) {
				query = query.filter(new PropertyFilter("university", "=", university));
			}

			if ( updated === undefined && analyzed === undefined && expanded === undefined ) {
				query = query.order("__key__");
			}

			if ( offset ) {
				query = query.offset(offset);
			}

			if ( limit ) {
				query = query.limit(limit);
			}

			const [entities] = await datastore.runQuery(query);

			return entities.map(clean);

		}, (value, elapsed) => {
			logger.info`retrieved <${report(value.length)}> units in <${report(elapsed)}> ms`;
		}
	);

}

/**
 * Inserts or updates units in the datastore.
 *
 * Performs upsert operations, creating new units or updating existing ones based on their ID.
 * Processing timestamps (`updated`, `analyzed`, `expanded`) default to `0` if not specified.
 * Formal names are indexed as a normalized signature supporting fuzzy matching, while URLs are stored verbatim, as
 * supplied by the caller.
 * Operations are batched automatically for efficiency.
 *
 * @param items Single unit or array of units to insert
 *
 * @returns Array of inserted units
 */
async function insert(items: Unit | readonly Unit[]): Promise<readonly Unit[]> {

	return time(async () => {

		const itemsArray = Array.isArray(items) ? items : [items];

		for (let i = 0; i < itemsArray.length; i += batch) {
			await datastore.upsert(itemsArray.slice(i, i+batch).map(item => {

				const data = {
					...item,
					updated: item.updated ?? 0,
					analyzed: item.analyzed ?? 0,
					expanded: item.expanded ?? 0,
					profile: item.profile,
					website: item.website,
					signature: item.formal && signature(tokenize(item.formal))
				};

				return {
					key: datastore.key([kind, uuid.v5(item.id, namespace)]),
					data,
					excludeFromIndexes: Object.keys(data).filter(field => !indexed.has(field))
				};

			}));
		}

		return itemsArray;

	}, (value, elapsed) => {
		logger.info`inserted <${report(value.length)}> units in <${report(elapsed)}> ms`;
	});

}

/**
 * Removes units from the datastore.
 *
 * When `items` is provided, deletes only the specified units.
 * When `items` is omitted, removes ALL units from the datastore.
 * Operations are batched automatically for efficiency.
 *
 * @param items Optional single unit, array of units, or undefined to remove all units
 */
async function remove(items?: Unit | readonly Unit[]): Promise<void> {

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
					await datastore.delete(entities.slice(i, i+batch).map((entity: Entity) => entity[datastore.KEY]));
				}
			}

			return entities;

		}

	}, (value, elapsed) => {
		logger.info`removed <${report(value.length)}> units in <${report(elapsed)}> ms`;
	});

}


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

	const { [datastore.KEY]: _, signature, ...item } = entity;

	return item;
}


/**
 * Tokenizes a name into a set of normalized words, filtering by length.
 * Applies the same normalization as normalizeName() before tokenizing.
 * Language-agnostic: uses word length rather than stopword lists.
 *
 * @param name - The name to tokenize
 *
 * @returns Set of normalized, filtered tokens
 */
function tokenize(name: string): Set<string> {
	return new Set(name
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.toUpperCase()
		.trim()
		.split(/\s+/)
		.filter(token => token.length > FuzzyTokenThreshold)
	);
}

/**
 * Computes a signature string from a set of tokens for exact matching.
 * The signature is a sorted, space-separated string.
 *
 * @param tokens - Set of normalized tokens
 *
 * @returns Sorted, space-separated token string
 */
function signature(tokens: Set<string>): string {
	return [...tokens].sort().join(" ");
}

/**
 * Computes Jaccard similarity between two sets of tokens.
 * Returns a value between 0 (no overlap) and 1 (identical sets).
 *
 * @param a - First token set
 * @param b - Second token set
 *
 * @returns Jaccard similarity coefficient (intersection size / union size)
 */
function jaccard(a: Set<string>, b: Set<string>): number {
	if ( a.size === 0 && b.size === 0 ) { // both empty = identical

		return 1.0;

	} else if ( a.size === 0 || b.size === 0 ) { // one empty = no similarity

		return 0.0;

	} else {

		const intersection = new Set([...a].filter(token => b.has(token)));
		const union = new Set([...a, ...b]);

		return intersection.size/union.size;

	}
}
