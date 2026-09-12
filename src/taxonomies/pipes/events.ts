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
import { Topic } from "@/taxonomies/index.js";
import { base, EC2U } from "@/vocabularies/ec2u.js";
import { resource } from "@metreeca/blue/resource";
import { immutable } from "@metreeca/core/structures";


// stated off `base` rather than off `taxonomies`, which the shape module assigns too late in a cycle

const Taxonomies = `${base}/taxonomies`;

export const events = immutable({ // !!! sync from `taxonomies-ec2u-events`

	id: `${Taxonomies}/events`,

	dataset: Taxonomies,

	label: "EC2U Events",

	title: "EC2U Event Types",
	alternative: "EC2U Events",
	description: "Standardized terminology for categorizing academic and community events within the EC2U Alliance.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40],

	issued: "2025-05-01"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function EventTopic() {
	return resource(Topic, {}, { pattern: `${events.id}/*` });
}
