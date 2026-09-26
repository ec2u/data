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

import { CCBYNCND40, Copyright } from "@ec2u/data-shared/datasets/index.core.js";
import { taxonomies } from "@ec2u/data-shared/taxonomies/index.core.js";
import { Topic } from "@ec2u/data-shared/taxonomies/index.js";
import { EC2U } from "@ec2u/data-shared";
import { resource } from "@metreeca/blue/resource";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";


export const stakeholders = immutable({ // !!! sync from `taxonomies-ec2u-stakeholders`

	id: resolve(taxonomies.id, "stakeholders"),

	dataset: taxonomies.id,

	label: "EC2U Stakeholders",

	title: "EC2U Stakeholder Types",
	alternative: "EC2U Stakeholders",
	description: "Standardized terminology for categorizing people and organizations roles within the EC2U Alliance.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40],

	issued: "2025-05-01"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function StakeholderTopic() {
	return resource(Topic, { pattern: `${stakeholders.id}/*` }, {});
}
