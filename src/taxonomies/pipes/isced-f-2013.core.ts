/*
 * Copyright © 2025-2026 Metreeca srl
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

import { taxonomies } from "@/taxonomies/index.core.js";
import { Topic } from "@/taxonomies/index.js";
import { resource } from "@metreeca/blue/resource";
import { dedent } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";


export const iscedf2013 = immutable({ // !!! sync from the EU vocabularies SKOS distribution

	id: `${taxonomies.id}/isced-f-2013`,

	dataset: taxonomies.id,

	label: "ISCED-F 2013",

	title: "International Standard Classification of Education: Fields of Education and Training 2013",
	alternative: "ISCED-F 2013",
	description: dedent`
		International Standard Classification of Education: Fields of Education and Training 2013 (ISCED-F 2013) is a
		classification of fields of education, which accompanies ISCED 2011. ISCED-F 2013 contains 11 broad fields
		(2 digits), 29 narrow fields (3 digits) and about 80 detailed fields (4 digits).
	`,

	publisher: "http://www.uis.unesco.org/",
	rights: "Copyright © 2015 UNESCO Institute for Statistics",

	source: "https://uis.unesco.org/sites/default/files/documents"
		+"/international-standard-classification-of-education-fields-of-education-and-training-2013"
		+"-detailed-field-descriptions-2015-en.pdf",

	issued: "2013-11-13",
	version: "20240110-0"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ISCEDF2013Topic() {
	return resource(Topic, { pattern: `${iscedf2013.id}/*` }, {});
}
