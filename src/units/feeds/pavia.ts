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

import { createGoogleAI, json } from "@/_/muse-google/index.js";
import { file } from "@/_/node/files.js";
import { retrieve } from "@/pages/index.js";
import { pages } from "@/pages/store.js";
import { fetchPage } from "@/pages/tools/fetchPage.js";
import { matches, merge, Unit, units } from "@/units/index.js";
import { _units } from "@/units/store.js";
import { universities } from "@/universities/index.js";
import { Type } from "@google/genai";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { each } from "@metreeca/flow/sinks";
import { flat, fork, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { log, report, time } from "@metreeca/tape";
import * as uuid from "uuid";


const Concurrency = 32;


const logger = log(import.meta.url);


const university = universities.pavia;

const roots = [
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti",
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-servizio-dateneo",
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-ricerca-interdipartimentali",
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/grandi-infrastrutture-di-ricerca"
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const tools = [
	fetchPage({ cache: pages.lookup(retrieve) })
];


if ( import.meta.main ) {
	await bootstrap();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function bootstrap(): Promise<void>;
export async function bootstrap(url: string): Promise<readonly Partial<Unit>[]>;


export async function bootstrap(url?: string): Promise<unknown> {

	if ( url ) {

		return json<Partial<Unit>>(await service(createGoogleAI).models.generateContent({
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

		await time(() => pipe(
			(items(roots))

			(map(async root => pipe(
				(items(await bootstrap(root)))
				(map(item => ({

					...item,

					authoritative: ["parent", "university", "profile"],

					parent: university,
					university: university,

					profile: root

				} satisfies Partial<Unit>)))
			)))

			(fork(Concurrency, flat()))
			(each(async item => {

				const current = await _units.lookup(item);

				await _units.insert(!current ? { ...item, id: `${units}/${uuid.v4()}` }
					: !matches(current, item) ? merge(current, { ...item, analyzed: undefined, expanded: undefined })
						: current
				);

			}))
		), (count, elapsed) => {
			logger.info`identified <${count}> units in <${report(elapsed)}> ms`;
		});

	}

}
