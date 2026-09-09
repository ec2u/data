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

import { file } from "@/_/gear/files.js";
import { createGoogleAI, json } from "@/_/muse-google/index.js";
import { topics } from "@/taxonomies/_topics/store.js";
import { matchTopics } from "@/taxonomies/_topics/tools/matchTopics.js";
import { Unit } from "@/units/_index.js";
import { Type } from "@google/genai";
import { markdown } from "@metreeca/core/strings";
import { service } from "@metreeca/gear";
import { log } from "@metreeca/tape";


const scheme = "https://data.ec2u.eu/taxonomies/organizations/";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const logger = log(import.meta.url);


const tools = [
	matchTopics({ topics: scheme => topics.select({ scheme }) })
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Classifies a research unit according to organizational typology.
 *
 * @param unit Unit information including formal name, and summary
 *
 * @returns Typology classification
 */
export async function classify(unit: Partial<Unit>): Promise<Partial<Unit>> {
	return {
		...unit, ...(await validate(json<{ type?: string }>(await service(createGoogleAI).models.generateContent({
			model: "gemini-2.5-flash",
			contents: markdown`
				formal: ${unit.formal ?? "Not provided"}
				summary: ${unit.summary ?? "Not provided"}
			`,
			config: {
				seed: 0,
				temperature: 0,
				systemInstruction: await file(".sys.md", import.meta.url),
				tools,
				automaticFunctionCalling: {
					maximumRemoteCalls: 10
				},
				responseMimeType: "application/json",
				responseSchema: {
					type: Type.OBJECT,
					properties: {
						type: {
							type: Type.STRING,
							description: markdown`
								Formal typology ID from the organizations taxonomy - MUST be a complete URL
								from matchTopics results (e.g., 
								'https://data.ec2u.eu/taxonomies/organizations/university-unit/department')
							`
						}
					},
					required: ["type"]
				}
			}
		}))))
	};
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Validates typology to ensure it comes from organizations taxonomy.
 *
 * @param result Classification result from AI model
 * @returns Validated result with invalid typology removed
 */
async function validate(result: { type?: string }): Promise<{ type?: string }> {
	if ( result.type ) {

		if ( await topics.lookup({ id: result.type, scheme: scheme }) ) {

			return result;

		} else {

			logger.warning`invalid typology <${result.type}> for scheme <${scheme}>`;

			return { type: undefined };

		}

	} else {

		return result;

	}
}
