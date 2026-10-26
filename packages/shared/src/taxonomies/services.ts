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

import { CCBYNCND40, Copyright } from "@ec2u/data-shared/datasets/index.core.js";
import { taxonomies } from "@ec2u/data-shared/taxonomies/index.core.js";
import { Topic } from "@ec2u/data-shared/taxonomies/index.js";
import { EC2U } from "@ec2u/data-shared";
import { resource } from "@metreeca/blue/resource";
import { resolve } from "@metreeca/core/resource";
import { dedent } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";


export const services = immutable({ // !!! sync from `taxonomies-ec2u-services`

	id: resolve(taxonomies.id, "services"),

	dataset: taxonomies.id,

	label: "EC2U Services",

	title: { en: "EC2U Service Types" },
	alternative: { en: "EC2U Services" },
	description: { en: dedent`
		Standardised terminology for categorising services provided by partner universities and third parties to
		students, faculty and staff within the EC2U Alliance, with a special focus on ESC cardholders on mobility.
	` },

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40],

	issued: "2025-07-11"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ServiceTopic() {
	return resource(Topic, { pattern: `${services.id}/*` });
}
