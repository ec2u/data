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

import { taxonomies } from "@ec2u/data-shared/taxonomies/index.core.js";
import { Topic } from "@ec2u/data-shared/taxonomies/index.js";
import { resource } from "@metreeca/blue/resource";
import { resolve } from "@metreeca/core/resource";
import { dedent } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";


export const sdgs = immutable({ // !!! sync from `taxonomies-ec2u-sdgs`

	id: resolve(taxonomies.id, "sdgs"),

	dataset: taxonomies.id,

	label: "UN SDGs",

	title: { en: "United Nations Sustainable Development Goals" },
	alternative: { en: "UN SDGs" },
	description: { en: dedent`
		[The 2030 Agenda for Sustainable Development](https://sdgs.un.org/2030agenda), adopted by all United Nations
		Member States in 2015, provides a shared blueprint for peace and prosperity for people and the planet, now and
		into the future. At its heart are the 17 Sustainable Development Goals (SDGs), which are an urgent call for action
		by all countries - developed and developing - in a global partnership. They recognize that ending poverty and other
		deprivations must go hand-in-hand with strategies that improve health and education, reduce inequality, and spur
		economic growth – all while tackling climate change and working to preserve our oceans and forests.
	` },

	publisher: "http://un.org/", // the United Nations

	rights: "Copyright © 2019 United Nations",
	accessRights: { en: dedent`
		The SDG Knowledge Organization System, accessible at http://metadata.un.org/sdg, is made available free of charge
		and may be copied freely, duplicated and further distributed with the following citation: Amit Joshi, Luis
		Gonzalez Morales, Szymon Klarman, and Aaron Helton. 2019. A Knowledge Organization System for the United Nations
		Sustainable Development Goals. New York, NY. http://metadata.un.org/sdg
	` },

	source: "https://sdgs.un.org/goals",

	created: "2015-09-25",
	issued: "2019-12-19"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function SDGTopic() {
	return resource(Topic, { pattern: `${sdgs.id}/*` }, {});
}
