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

import { base, EC2U, licenses } from "@ec2u/data-shared";
import { Concept } from "@ec2u/data-shared/taxonomies/index.js";
import { resource } from "@grafctory/blue/resource";
import { resolve } from "@grafctory/core/resource";
import { dedent } from "@grafctory/core/strings";
import { immutable } from "@grafctory/core/values";


export const events = immutable({ // !!! sync from `taxonomies-ec2u-events`

	id: resolve(base, "/taxonomies/events"),

	dataset: resolve(base, "/taxonomies/"),

	label: "EC2U Event Types",

	title: { en: "EC2U Academic and Community Event Types" },
	alternative: { en: "EC2U Event Types" },
	description: {
		en: dedent`
		Classifies academic and community events on independent facets (what an event is about, how it is run and whom
		it addresses), so each one is described from every angle rather than forced into a single category. The facets
		are kept broad, giving events announced by each university in its own terms a shared vocabulary for filtering.
	`
	},

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id],

	created: "2025-02-11",
	issued: "2025-05-01"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function EventConcept() {
	return resource(Concept, {

		name: `${events.label} Concept`,
		description: `A concept of the ${events.label} taxonomy.`,

		pattern: `${events.id}/*`

	});
}
