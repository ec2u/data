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

import { pages } from "@/pipelines/pages/store";
import { fetchPage } from "@/pipelines/pages/tools/fetchPage";
import { matches, merge, Unit } from "@/pipelines/units";
import { units } from "@/pipelines/units/store";
import { ai, data } from "@/utilities/gcp/gemini";
import { pavia, Units } from "@/utilities/hub";
import { file } from "@/utilities/node/files";
import { uuid } from "@/utilities/node/uuid";
import { Type } from "@google/genai";
import { batch, flatMap, forEach, items, map, peek, pipe } from "@metreeca/pipe";


const tools = [
	fetchPage({ cache: pages.lookup })
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function scan(url: string): Promise<readonly Partial<Unit>[]> {
	return data(await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents: url,
		config: {
			seed: 0,
			temperature: 0,
			systemInstruction: await file(".ai", import.meta.url),
			tools
		}
	}), {
		type: Type.ARRAY,
		items: {
			type: Type.OBJECT,
			properties: {
				formal: {
					type: Type.STRING,
					description: `REQUIRED - The full official name of the research unit. MUST NOT include the acronym 
					in this field. Example: 'Laboratory for Computational Biology' not 'Laboratory for Computational 
					Biology (LCB)'`
				},
				acronym: {
					type: Type.STRING,
					description: `OPTIONAL - The acronym or short form of the research unit name. Only include if
					 explicitly mentioned in the source. Omit this field entirely if not available. Example: 'LCB'`
				},
				website: {
					type: Type.STRING,
					description: `OPTIONAL - The complete URL of the research unit's homepage or main web presence.
					Must be a valid URL starting with http:// or https://. Omit this field entirely if not available. 
					Example: 'https://lab.university.edu'`
				}
			},
			required: ["formal"]
		}
	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


pipe(
	(items([
		"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti",
		"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-servizio-dateneo",
		"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-ricerca-interdipartimentali",
		"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/grandi-infrastrutture-di-ricerca"
	]))
	(flatMap(root => pipe(
		items([root])
		(flatMap(scan, {
			parallel: 0
		}))
		(map(item => ({

			parent: pavia,
			university: pavia,

			formal: item.formal,
			acronym: item.acronym,

			profile: root,
			website: item.website

		})))
	), {
		parallel: 0
	}))
	(map(async item => {

		const current = await units.lookup(item);

		return !current ? { ...item, id: `${Units}${uuid()}` }
			: !matches(current, item) ? merge(current, { ...item, updated: undefined })
				: current;

	}))
	(peek(console.info))
	(batch())
	(map(async (items) => {
		// Deduplicate by id - first entry wins, log warnings for duplicates
		const seen = new Map<string, Unit>();
		const duplicates: Unit[] = [];

		for (const item of items) {
			if ( seen.has(item.id) ) {
				duplicates.push(item);
			} else {
				seen.set(item.id, item);
			}
		}

		if ( duplicates.length > 0 ) {
			console.warn(`⚠️  Ignoring ${duplicates.length} duplicate unit(s):`);
			for (const dup of duplicates) {
				console.warn(`   - ${dup.formal || dup.id} (id: ${dup.id})`);
			}
		}

		return Array.from(seen.values());
	}))
	(forEach(units.insert))
);
