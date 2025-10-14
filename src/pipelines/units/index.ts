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

	/** The IRI identifying the research unit. */
	readonly id: string;

	/** The IRI identifying the parent unit.
	 *
	 * For top-level units ths is expected to be the university id. */
	readonly parent: string;

	/** The IRI identifying the university. */
	readonly university: string;


	/** Timestamp when the record was last updated. */
	readonly updated: number;

	/** Timestamp when the record was last updated from web sources. */
	readonly visited?: number;

	/** Timestamp when the record was deleted. */
	readonly deleted?: number;


	/** List of field names that were populated from an authoritative source. */
	readonly authoritative?: readonly string[];


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
