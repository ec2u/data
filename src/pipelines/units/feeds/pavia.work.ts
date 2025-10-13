/*
 * Copyright © 2025 Metreeca srl
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

import { Lead } from "@/pipelines/units";
import { scan, structure } from "@/pipelines/units/feeds/pavia";
import { id, pavia, units } from "@/utilities/hub";


const root=
		"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti"
	// "https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-servizio-dateneo"
	// "https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-ricerca-interdipartimentali"
	// "https://portale.unipv.it/it/ricerca/strutture-di-ricerca/grandi-infrastrutture-di-ricerca"
;


Promise.resolve(root)

	.then(scan)
	.then(structure)

	.then((items): readonly Lead[] => items.map(item => ({

		id: `${units}${id(pavia, item.website ?? root)}`,

		lead: true,

		parent: pavia,
		university: pavia,

		formal: item.formal,
		acronym: item.acronym,

		website: item.website ?? root

	})))

	.then(console.info);
