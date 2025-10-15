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

import { scan } from "@/pipelines/units/feeds/pavia";
import { units } from "@/pipelines/units/store";
import { pavia } from "@/utilities/hub";
import { uuid } from "@/utilities/node/uuid";
import { Units } from "../../../utilities/hub";
import { matches, merge } from "../index";


const root=
		"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti"
	// "https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-servizio-dateneo"
	// "https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-ricerca-interdipartimentali"
	// "https://portale.unipv.it/it/ricerca/strutture-di-ricerca/grandi-infrastrutture-di-ricerca"
;


const university=pavia;

Promise.resolve(root)

	.then(scan)

	.then(items => items.map(item => ({

		parent: university,
		university: university,

		formal: item.formal,
		acronym: item.acronym,

		profile: root,
		website: item.website

	})))

	.then(async items => Promise.all(items.map(async item => {

		const current=await units.lookup(item);

		return !current ? { ...item, id: `${Units}${uuid()}` }
			: !matches(current, item) ? merge(current, { ...item, updated: undefined })
				: current;

	})))

	.then(units.insert)
	.then(console.info);
