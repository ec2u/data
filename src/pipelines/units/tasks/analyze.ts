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
import { Level, log, simple } from "@/utilities/_/logger";
import { guard, message, time } from "@/utilities/_/logger/log";
import { md } from "@/utilities/core/tags";
import { ai, json } from "@/utilities/gcp/gemini";
import { file } from "@/utilities/node/files";
import { Type } from "@google/genai";
import { isString } from "@metreeca/core";
import { pipe } from "@metreeca/pipe";
import { items } from "@metreeca/pipe/feeds";
import { forEach } from "@metreeca/pipe/sinks";
import { flatMap, map, peek } from "@metreeca/pipe/tasks";


const logger = log(import.meta.url);

const tools = [
	fetchPage({ cache: pages.lookup }),
	matchTopics({ topics: scheme => topics.select({ scheme }) }),
	listTopics({ topics: scheme => topics.select({ scheme }) })
];


if ( import.meta.main ) {

	log({

		console: simple(),

		"": {
			level: Level.info,
			sink: "console"
		}

	});

	analyze();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function analyze(): Promise<number>;
export async function analyze(lead: Partial<Unit>): Promise<Partial<Unit>>;

export async function analyze(lead?: Partial<Unit>) {

	if ( lead ) {

		return await validate(json<Partial<Unit>>(await ai.models.generateContent({
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
				systemInstruction: await file(".sys.md", import.meta.url),
				tools,
				automaticFunctionCalling: {
					maximumRemoteCalls: 50
				},
				responseMimeType: "application/json",
				responseSchema: {
					type: Type.OBJECT,
					properties: {
						formal: {
							type: Type.STRING,
							description: md`
								Formal name of the research unit - MUST include the unit typology
								(e.g., 'Laboratory of...', 'Department of...', 'Research Group on...')
							`
						},
						short: {
							type: Type.STRING,
							description: md`
								Short name of the research unit (OPTIONAL - omit if not actually found on website,
								or if it equals the formal name or acronym)
							`
						},
						acronym: {
							type: Type.STRING,
							description: md`
								Acronym of the research unit (OPTIONAL - omit if not actually found on website)
							`
						},
						identifier: {
							type: Type.STRING,
							description: md`
								Internal identifier of the research unit (OPTIONAL - omit if not actually found on website)
							`
						},
						email: {
							type: Type.STRING,
							description: md`
								Institutional email address of the research unit
								(OPTIONAL - omit if not actually found on website)
							`
						},
						type: {
							type: Type.STRING,
							description: md`
								Formal topic ID from the organizations taxonomy - MUST be a complete URL preserved exactly
								as found (e.g., 'https://data.ec2u.eu/...')
							`
						},
						topics: {
							type: Type.ARRAY,
							items: { type: Type.STRING },
							description: md`
								List of topic IDs from matchTopics results - use exact IDs returned by the tool
							`
						},
						summary: {
							type: Type.STRING,
							description: md`
								REQUIRED - Summary of the research unit (~500 chars) - NEVER omit this field
							`
						},
						description: {
							type: Type.STRING,
							description: md`
								General description in markdown format
							`
						},
						keywords: {
							type: Type.ARRAY,
							items: { type: Type.STRING },
							description: md`
								List of keywords research topics and fields
							`
						}
					},
					required: [
						"formal",
						"type",
						"topics",
						"summary",
						"description",
						"keywords"
					]
				}
			}
		})));

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
					parallel: true
				}))
				(peek(v => console.info(v)))
				(forEach(units.insert))
			), (count, elapsed) => logger.info
				`processed <${count}> units in <${message(elapsed)}> ms`
		);

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Validates extracted unit data to ensure correct taxonomy usage.
 *
 * - Typology must come from organizations taxonomy (https://data.ec2u.eu/taxonomies/organizations/)
 * - Topics must exist in EuroSciVoc taxonomy (verified via lookup)
 *
 * @param result Extracted unit data from AI model
 * @returns Validated result with incorrect taxonomy entries removed
 */
async function validate(result: Partial<Unit>): Promise<Partial<Unit>> {

	const organizations = "https://data.ec2u.eu/taxonomies/organizations/";
	const euroscivoc = "https://data.ec2u.eu/taxonomies/euroscivoc/";

	async function check(id: string, scheme: string): Promise<string | undefined> {
		if ( await topics.lookup({ id, scheme }) ) {

			return id;

		} else {

			logger.warning`invalid entry <${id}> for scheme <${scheme}>`;

			return undefined;

		}
	}

	return {

		...result,

		type: result.type ? await check(result.type, organizations) : undefined,
		topics: (await Promise.all((result.topics || []).map(id => check(id, euroscivoc)))).filter(isString)

	};
}
