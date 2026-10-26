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

import { EC2U } from "@ec2u/data-shared";
import { licenses } from "@ec2u/data-shared/datasets/index.core.js";
import { taxonomies } from "@ec2u/data-shared/taxonomies/index.core.js";
import { Topic } from "@ec2u/data-shared/taxonomies/index.js";
import { resource } from "@metreeca/blue/resource";
import { resolve } from "@metreeca/core/resource";
import { dedent } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";


export const events = immutable({ // !!! sync from `taxonomies-ec2u-events`

	id: resolve(taxonomies.id, "events"),

	dataset: taxonomies.id,

	label: "EC2U Events",

	title: { en: "EC2U Event Types" },
	alternative: { en: "EC2U Events" },
	description: { en: dedent`
		Standardised terminology for categorising academic and community events within the EC2U Alliance.
	` },

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id],

	issued: "2025-05-01"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function EventTopic() {
	return resource(Topic, { pattern: `${events.id}/*` });
}
