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

import { taxonomies } from "@ec2u/data-shared/taxonomies/index.core.js";
import { Topic } from "@ec2u/data-shared/taxonomies/index.js";
import { resource } from "@metreeca/blue/resource";
import { resolve } from "@metreeca/core/resource";
import { dedent } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";


export const isced2011 = immutable({ // !!! persist

	id: resolve(taxonomies.id, "isced-2011"),

	dataset: taxonomies.id,

	label: "ISCED 2011",

	title: "International Standard Classification of Education 2011",
	alternative: "ISCED 2011",
	description: dedent`
		The ISCED 2011 classification was adopted by the UNESCO General Conference at its 36th session in November 2011.
		Initially developed by UNESCO in the 1970s, and first revised in 1997, the ISCED classification serves as an
		instrument to compile and present education statistics both nationally and internationally.
	`,

	publisher: "http://www.uis.unesco.org/",
	rights: "Copyright © 2012 UNESCO Institute for Statistics",

	source: "https://uis.unesco.org/sites/default/files/documents"
		+"/international-standard-classification-of-education-isced-2011-en.pdf",

	issued: "2011-11-10"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ISCED2011Topic() {
	return resource(Topic, { pattern: `${isced2011.id}/*` }, {});
}
