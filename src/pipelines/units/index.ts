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
 * Lead to the online description of a research unit.
 */
export interface Lead {

	/** The internal URL id of the unit the lead refers to */
	readonly id?: string;

	/** The URL of the institutional profile of the unit */
	readonly profile?: string;

	/** The URL of the unit's self-managed website */
	readonly website?: string;

	/** The name of the research unit */
	readonly name?: string;

	/** A brief summary of the research unit */
	readonly summary?: string;

}

export interface Unit {

	readonly formal: string;
	readonly short?: string;
	readonly acronym?: string;

	readonly identifier?: string;
	readonly email?: string;

	readonly type: string;
	readonly topics: readonly string[];

	readonly summary: string;
	readonly description: string;
	readonly keywords: readonly string[];

}
