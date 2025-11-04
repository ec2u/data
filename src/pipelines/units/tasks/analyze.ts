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
import { topics } from "@/pipelines/topics/store";
import { listTopics } from "@/pipelines/topics/tools/listTopics";
import { matchTopics } from "@/pipelines/topics/tools/matchTopics";
import { matches, merge, stale, Unit } from "@/pipelines/units";
import { units } from "@/pipelines/units/store";
import { guard, log, message, time } from "@/utilities/core/log";
import { md } from "@/utilities/core/tags";
import { ai, data } from "@/utilities/gcp/gemini";
import { file } from "@/utilities/node/files";
import { Type } from "@google/genai";
import { flatMap, forEach, items, map, peek, pipe } from "@metreeca/pipe";


const tools = [
	fetchPage({ cache: pages.lookup }),
	matchTopics({ topics: scheme => topics.select({ scheme }) }),
	listTopics({ topics: scheme => topics.select({ scheme }) })
];


if ( import.meta.main ) {
	analyze();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function analyze(): Promise<void>;
export async function analyze(lead: Partial<Unit>): Promise<Partial<Unit>>;

export async function analyze(lead?: Partial<Unit>) {

	if ( lead ) {

		return data(await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: md`
				profile: ${lead.profile ?? "Not provided"}
				website: ${lead.website ?? "Not provided"}
				name: ${lead.formal ?? lead.short ?? "Not provided"}
				summary: ${lead.summary ?? "Not provided"}
			`,
			config: {
				seed: 0,
				temperature: 0,
				systemInstruction: await file(".ai", import.meta.url),
				tools,
				automaticFunctionCalling: {
					maximumRemoteCalls: 50
				}
			}
		}), {
			type: Type.OBJECT,
			properties: {
				formal: {
					type: Type.STRING,
					description: "Formal name of the research unit - MUST include the unit typology (e.g., 'Laboratory of...', 'Department of...', 'Research Group on...')"
				},
				short: {
					type: Type.STRING,
					description: "Short name of the research unit"
				},
				acronym: {
					type: Type.STRING,
					description: "Acronym of the research unit"
				},
				identifier: {
					type: Type.STRING,
					description: "Unique identifier of the research unit"
				},
				email: {
					type: Type.STRING,
					description: "Institutional email address of the research unit"
				},
				type: {
					type: Type.STRING,
					description: "Formal topic ID from the organizations taxonomy - MUST be a complete URL preserved exactly as found (e.g., 'https://data.ec2u.eu/...')"
				},
				topics: {
					type: Type.ARRAY,
					items: { type: Type.STRING },
					description: "List of formal research topic IDs - MUST be complete URLs preserved exactly as found, character-by-character (e.g., 'https://data.ec2u.eu/taxonomies/euroscivoc/...')"
				},
				summary: {
					type: Type.STRING,
					description: "REQUIRED - Summary of the research unit (~500 chars) - NEVER omit this field"
				},
				description: {
					type: Type.STRING,
					description: "General description in markdown format"
				},
				keywords: {
					type: Type.ARRAY,
					items: { type: Type.STRING },
					description: "List of keywords research topics and fields"
				}
			},
			required: ["formal", "type", "topics", "summary", "description", "keywords"]
		});

	} else {

		return time(() => pipe(
			(items(units.select({ analyzed: Date.now()-stale })))
			(flatMap(lead => pipe(
				items(lead)
				(map(guard(analyze)))
				(map(item => merge(lead, {

					...item,

					updated: matches(lead, item) ? lead.updated : Date.now(),
					analyzed: Date.now()

				})))
			), {
				parallel: 10
			}))
			(peek(v => console.info(v)))
			(forEach(units.insert))
		), (count, elapsed) => log.info(analyze.name,
			`processed <${count}> units in <${message(elapsed)}> ms`
		));

	}

}
