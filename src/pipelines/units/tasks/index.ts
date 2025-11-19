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

import { topics } from "@/pipelines/topics/store";
import { matchTopics } from "@/pipelines/topics/tools/matchTopics";
import { Unit } from "@/pipelines/units";
import { md } from "@/utilities/core/tags";
import { ai, json } from "@/utilities/gcp/gemini";
import { file } from "@/utilities/node/files";
import { Type } from "@google/genai";
import { isString } from "@metreeca/core";
import { log } from "@metreeca/core/logger";


const logger = log(import.meta.url);

const tools = [
	matchTopics({ topics: scheme => topics.select({ scheme }) })
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Identifies research topics for a unit by matching keywords to EuroSciVoc taxonomy.
 *
 * @param unit Unit information including formal name, summary, description, and keywords
 * @returns Topic identification
 */
export async function index(unit: Partial<Unit>): Promise<{ topics: string[] }> {

	return {
		...unit, ...(await validate(json<{ topics: string[] }>(await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: md`
			formal: ${unit.formal ?? "Not provided"}
			summary: ${unit.summary ?? "Not provided"}
			description: ${unit.description ?? "Not provided"}
			keywords: ${unit.keywords?.join(", ") ?? "Not provided"}
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
						topics: {
							type: Type.ARRAY,
							items: { type: Type.STRING },
							description: md`
							List of topic IDs from matchTopics results - use exact IDs returned by the tool,
							one matchTopics call per keyword
						`
						}
					},
					required: ["topics"]
				}
			}
		}))))
	};

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Validates topics to ensure they exist in EuroSciVoc taxonomy.
 *
 * @param result Topic indexing result from AI model
 * @returns Validated result with invalid topics removed
 */
async function validate(result: { topics: string[] }): Promise<{ topics: string[] }> {

	const euroscivoc = "https://data.ec2u.eu/taxonomies/euroscivoc/";

	async function check(id: string): Promise<string | undefined> {
		if ( await topics.lookup({ id, scheme: euroscivoc }) ) {

			return id;

		} else {

			logger.warning`invalid topic <${id}> for scheme <${euroscivoc}>`;

			return undefined;

		}
	}

	return {
		topics: (await Promise.all(result.topics.map(check))).filter(isString)
	};
}
