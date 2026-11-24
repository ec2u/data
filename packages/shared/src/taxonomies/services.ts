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


export const services = immutable({ // !!! sync from `taxonomies-ec2u-services`

	id: resolve(base, "/taxonomies/services"),

	dataset: resolve(base, "/taxonomies/"),

	label: "EC2U Service Types",

	title: { en: "EC2U University Community Services" },
	alternative: { en: "EC2U Service Types" },
	description: {
		en: dedent`
		Classifies the practical services available to the university community, offered by partner universities or by
		third parties to European Student Card holders, by the need they meet rather than by provider. Mobile students
		and staff can then find comparable support at a host university, whatever its local organisation.
	`
	},

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id],

	created: "2025-07-11",
	issued: "2025-07-11"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ServiceConcept() {
	return resource(Concept, {

		name: `${services.label} Concept`,
		description: `A concept of the ${services.label} taxonomy.`,

		pattern: `${services.id}/*`

	});
}
