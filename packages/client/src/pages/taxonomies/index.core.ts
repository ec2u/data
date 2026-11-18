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

import { opt } from "@metreeca/core";
import { date } from "@metreeca/tile/types/date";


/**
 * Lists the release details of a taxonomy as an infobox group.
 *
 * @param release The release details of the taxonomy, as retrieved from the store
 *
 * @returns The version and the localised creation, publication and modification dates of the taxonomy, each left
 *     undefined where the taxonomy does not state it, so the infobox leaves the entry out
 */
export function getTaxonomyRelease({ version, created, issued, modified }: {

	readonly version?: string
	readonly created?: string
	readonly issued?: string
	readonly modified?: string

}) {

	return {
		Version: version,
		Created: opt(created, value => date.format(value)),
		Published: opt(issued, value => date.format(value)),
		Modified: opt(modified, value => date.format(value))
	};

}
