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

import { base } from "@ec2u/data-shared";
import { Concept } from "@ec2u/data-shared/taxonomies/index.js";
import { unescoStatistics } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { resource } from "@grafctory/blue/resource";
import { resolve } from "@grafctory/core/resource";
import { dedent } from "@grafctory/core/strings";
import { immutable } from "@grafctory/core/values";


export const iscedf2013 = immutable({ // !!! sync from the EU vocabularies SKOS distribution

	id: resolve(base, "/taxonomies/isced-f-2013"),

	dataset: resolve(base, "/taxonomies/"),
	generated: true, // concept definitions backfilled by AI tools

	label: "ISCED-F 2013",

	title: { en: "International Standard Classification of Education: Fields of Education and Training 2013" },
	alternative: { en: "ISCED-F 2013" },
	description: {
		en: dedent`
		International Standard Classification of Education: Fields of Education and Training 2013 (ISCED-F 2013) is a
		classification of fields of education, which accompanies ISCED 2011. ISCED-F 2013 contains 11 broad fields
		(2 digits), 29 narrow fields (3 digits) and about 80 detailed fields (4 digits).
	`
	},

	publisher: unescoStatistics.id,
	rights: "Copyright © 2015 UNESCO Institute for Statistics",

	source: "https://uis.unesco.org/sites/default/files/documents"
		+"/international-standard-classification-of-education-fields-of-education-and-training-2013"
		+"-detailed-field-descriptions-2015-en.pdf",

	issued: "2013-11-13",
	version: "20240110-0"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ISCEDF2013Concept() {
	return resource(Concept, {

		name: `${iscedf2013.label} Concept`,
		description: `A concept of the ${iscedf2013.label} taxonomy.`,

		pattern: `${iscedf2013.id}/*`

	});
}
