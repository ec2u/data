/*
 * Copyright © 2020-2025 EC2U Alliance
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
import { ai, json } from "@/utilities/gcp/gemini";
import { pavia, Units } from "@/utilities/hub";
import { file } from "@/utilities/node/files";
import { uuid } from "@/utilities/node/uuid";
import { Type } from "@google/genai";

import { log, message, time } from "@metreeca/core/logger";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { forEach } from "@metreeca/flow/sinks";
import { flatMap, map, peek } from "@metreeca/flow/tasks";


const logger = log(import.meta.url);

const university = pavia;

const roots = [
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti",
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-servizio-dateneo",
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-ricerca-interdipartimentali",
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/grandi-infrastrutture-di-ricerca"
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const tools = [
	fetchPage({ cache: pages.lookup })
];


if ( import.meta.main ) {
	scan();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function scan(): Promise<void>;
export async function scan(url: string): Promise<readonly Partial<Unit>[]>;


export async function scan(url?: string): Promise<unknown> {

	if ( url ) {

		return json<Partial<Unit>>(await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: url,
			config: {
				seed: 0,
				temperature: 0,
				systemInstruction: await file(".sys.md", import.meta.url),
				tools,
				responseMimeType: "application/json",
				responseSchema: {
					type: Type.ARRAY,
					items: {
						type: Type.OBJECT,
						properties: {
							formal: {
								type: Type.STRING,
								description: `REQUIRED - The full official name of the research unit. MUST NOT include
								the acronym in this field. Example: 'Laboratory for Computational Biology' not 
								Laboratory for Computational Biology (LCB)'`
							},
							acronym: {
								type: Type.STRING,
								description: `OPTIONAL - The acronym or short form of the research unit name. Only
								include if explicitly mentioned in the source. Omit this field entirely if not
								available. Example: 'LCB'`
							},
							website: {
								type: Type.STRING,
								description: `OPTIONAL - The complete URL of the research unit's homepage or main web
								presence. Must be a valid URL starting with http:// or https://. Omit this field
								entirely if not available. Example: 'https://lab.university.edu'`
							}
						},
						required: [
							"formal"
						]
					}
				}
			}
		}));

	} else {

		time(() => pipe(
			(items(roots))
			(flatMap(root => pipe(
				items(root)
				(flatMap(scan))
				(map(item => ({

					...item,

					authoritative: ["parent", "university", "profile"],

					parent: university,
					university: university,

					profile: root

				} satisfies Partial<Unit>)))
			), {
				parallel: true
			}))
			(peek(v => console.info(v)))
			(forEach(async item => {

				const current = await units.lookup(item);

				await units.insert(!current ? { ...item, id: `${Units}${uuid()}` }
					: !matches(current, item) ? merge(current, { ...item, analyzed: undefined, expanded: undefined })
						: current
				);

			}))
			), (count, elapsed) => logger.info
			`identified <${count}> units in <${message(elapsed)}> ms`
		);

	}

}
