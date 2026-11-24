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


export const documents = immutable({ // !!! sync from `taxonomies-ec2u-documents`

	id: resolve(base, "/taxonomies/documents"),

	dataset: resolve(base, "/taxonomies/"),

	label: "EC2U Document Types",

	title: { en: "EC2U Institutional Document Types" },
	alternative: { en: "EC2U Document Types" },
	description: {
		en: dedent`
		Classifies the institutional documents of the partner universities and the alliance by their legal force and
		purpose, setting founding and binding texts apart from strategic, operational and reporting ones. Types are
		shared across the alliance, so documents named differently by each university can be found and compared.
	`
	},

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id],

	created: "2023-07-12",
	issued: "2025-05-01"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DocumentConcept() {
	return resource(Concept, {

		name: `${documents.label} Concept`,
		description: `A concept of the ${documents.label} taxonomy.`,

		pattern: `${documents.id}/*`

	});
}
