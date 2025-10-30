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
 * Structured information about a research unit.
 *
 * Timestamps are in milliseconds from epoch.
 */
export interface Unit {

	/**
	 * Updating timestamp.
	 *
	 * - `undefined | 0` = not yet processed
	 * - `> 0` = last updated at this timestamp
	 * - `< 0` = deleted at the absolute value of this timestamp
	 */
	readonly updated?: number;

	/**
	 * Processing timestamp by the scraping task.
	 *
	 * - `undefined` = never processed or needs reprocessing
	 * - `> 0` = scraped at the specified timestamp
	 */
	readonly scraped?: number;

	/**
	 * Processing timestamp by the scanning task.
	 *
	 * - `undefined` = never processed or needs reprocessing
	 * - `> 0` = scanned at the specified timestamp
	 */
	readonly scanned?: number;


	/** List of field names that were populated from an authoritative source. */
	readonly authoritative?: readonly string[];


	/** The IRI identifying the research unit. */
	readonly id: string;

	/** The IRI identifying the parent unit.
	 *
	 * For top-level units ths is expected to be the university id. */
	readonly parent: string;

	/** The IRI identifying the university. */
	readonly university: string;


	/** The formal name. */
	readonly formal?: string;

	/** The short name. */
	readonly short?: string;

	/** The acronym. */
	readonly acronym?: string;


	/** The unique identifier. */
	readonly identifier?: string;

	/** The contact email address. */
	readonly email?: string;

	/**
	 * The URL of the institutional profile.
	 *
	 * May be shared with other units, for instance, in the case of directories or collective descriptions of multiple
	 * organizational units.
	 */
	readonly profile?: string;

	/** The URL of the self-managed website.
	 *
	 * The website is expected to be specific to the unit.
	 */
	readonly website?: string;


	/** The concept IRI of the type or category. */
	readonly type?: string;

	/** The concept IRI of the research topics. */
	readonly topics?: readonly string[];


	/** A brief summary. */
	readonly summary?: string;

	/** A detailed description. */
	readonly description?: string;

	/** Keywords describing the research focus. */
	readonly keywords?: readonly string[];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if a unit matches all properties specified in a partial unit.
 *
 * @param match the unit to test against
 * @param item the partial unit containing properties to match
 *
 * @returns true if all properties in item have equal values in match, false otherwise
 */
export function matches(match: Unit, item: Partial<Unit>) {
	return Object.entries(item).every(([key, value]) => match[key as keyof Unit] === value);
}

/**
 * Merges a delta unit into an existing unit value, respecting authoritative field declarations.
 *
 * Fields marked as authoritative in the existing value are preserved unless the delta also declares them as
 * authoritative. This allows controlled updates where certain fields can be protected from modification.
 *
 * @param value the existing unit to merge into
 * @param delta the partial unit containing updates to apply
 * @returns a new unit with delta fields merged into value, respecting authoritative declarations
 */
export function merge<U extends Partial<Unit>>(value: U, delta: Partial<Unit>): U {

	const valueAuthoritative = new Set(value.authoritative ?? []);
	const deltaAuthoritative = new Set(delta.authoritative ?? []);

	return Object.assign({}, value, Object.fromEntries(Object.entries(delta).filter(([key]) =>
		!valueAuthoritative.has(key) || deltaAuthoritative.has(key)
	)));
}
