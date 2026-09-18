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

import { CCBYNCND40, Copyright } from "@/datasets/index.core.js";
import { taxonomies } from "@/taxonomies/index.core.js";
import { Topic } from "@/taxonomies/index.js";
import { EC2U } from "@/vocabularies/ec2u.js";
import { resource } from "@metreeca/blue/resource";
import { immutable } from "@metreeca/core/values";


export const documents = immutable({ // !!! sync from `taxonomies-ec2u-documents`

	id: `${taxonomies.id}/documents`,

	dataset: taxonomies.id,

	label: "EC2U Documents",

	title: "EC2U Document Types",
	alternative: "EC2U Documents",
	description: "Standardized terminology for categorizing institutional documents shared within the EC2U Alliance.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40],

	issued: "2025-05-01"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DocumentTopic() {
	return resource(Topic, { pattern: `${documents.id}/*` }, {});
}
