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

import { Unit } from "@/pipelines/units";
import { scan, structure } from "@/pipelines/units/feeds/pavia";
import { units } from "@/pipelines/units/store";
import { pavia } from "@/utilities/hub";
import { base } from "../../../utilities/hub";
import { uuid } from "../../../utilities/node/uuid";


const root=
		"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti"
	// "https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-servizio-dateneo"
	// "https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-ricerca-interdipartimentali"
	// "https://portale.unipv.it/it/ricerca/strutture-di-ricerca/grandi-infrastrutture-di-ricerca"
;


const university=pavia;

Promise.resolve(root)

	.then(scan)
	.then(structure)

	.then(items => items.map(item => ({

		parent: university,
		university: university,

		updated: Date.now(),

		formal: item.formal,
		acronym: item.acronym,

		profile: root,
		website: item.website

	})))

	.then(async (items): Promise<readonly Unit[]> => Promise.all(items.map(async item => {

		const match=await units.lookup(item);

		return match ? merge(match, item) : { ...item, id: `${base}units/${uuid()}` };

	})))

	.then(units.insert)
	.then(console.info);


/**
 * Merges a delta unit into an existing unit value, respecting authoritative field declarations.
 *
 * Fields marked as authoritative in the existing value are preserved unless the delta also declares them as
 * authoritative. This allows controlled updates where certain fields can be protected from modification.
 *
 * @param value the existing unit to merge into
 * @param delta the partial unit containing updates to apply
 * @returns a new unit with delta fields merged into value, respecting authoritative declarations
 */
function merge<U extends Partial<Unit>>(value: U, delta: Partial<Unit>): U {

	const valueAuthoritative=new Set(value.authoritative ?? []);
	const deltaAuthoritative=new Set(delta.authoritative ?? []);

	return Object.assign({}, value, Object.fromEntries(Object.entries(delta).filter(([key]) =>
		!valueAuthoritative.has(key) || deltaAuthoritative.has(key)
	)));
}
