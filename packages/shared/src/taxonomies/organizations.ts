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
import { resource } from "@metreeca/blue/resource";
import { resolve } from "@metreeca/core/resource";
import { dedent } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";


export const organizations = immutable({ // !!! sync from `taxonomies-ec2u-organizations`

	id: resolve(base, "/taxonomies/organizations"),

	dataset: resolve(base, "/taxonomies/"),

	label: "EC2U Organisation Types",

	title: { en: "EC2U Organisation and Unit Types" },
	alternative: { en: "EC2U Organisation Types" },
	description: {
		en: dedent`
		Classifies the organisations the alliance deals with by their institutional and legal nature, and the internal
		units of universities by the role they play in teaching and research. Units are typed apart from the names each
		university gives them, so bodies with different local titles can be matched across the alliance.
	`
	},

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id],

	created: "2024-03-27",
	issued: "2024-03-27"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function OrganizationConcept() {
	return resource(Concept, {

		name: `${organizations.label} Concept`,
		description: `A concept of the ${organizations.label} taxonomy.`,

		pattern: `${organizations.id}/*`

	});
}
