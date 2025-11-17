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
import { listTopics } from "@/pipelines/topics/tools/listTopics";
import { Unit } from "@/pipelines/units";
import { md } from "@/utilities/core/tags";
import { ai, json } from "@/utilities/gcp/gemini";
import { file } from "@/utilities/node/files";
import { Type } from "@google/genai";
import { log } from "@metreeca/core/logger";


const logger = log(import.meta.url);

const tools = [
	listTopics({ topics: scheme => topics.select({ scheme }) })
];


if ( import.meta.main ) {
	// Example usage for testing
	const sample: Partial<Unit> = {
		formal: "Department of Computer Science",
		summary: "An academic department focused on computer science education and research.",
		description: "The Department of Computer Science is a primary academic division dedicated to teaching and research in computing, algorithms, software engineering, and related fields."
	};

	classify(sample).then(result => {
		console.log(JSON.stringify(result, null, 2));
	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Classifies a research unit according to organizational typology.
 *
 * @param unit Unit information including formal name, summary, and description
 * @returns Typology classification
 */
export async function classify(unit: Partial<Unit>): Promise<{ type?: string }> {

	const result = json<{ type?: string }>(await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents: md`
			formal: ${unit.formal ?? "Not provided"}
			summary: ${unit.summary ?? "Not provided"}
			description: ${unit.description ?? "Not provided"}
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
						description: md`
							Formal typology ID from the organizations taxonomy - MUST be a complete URL
							from listTopics results (e.g., 'https://data.ec2u.eu/taxonomies/organizations/university-unit/department')
						`
					}
				},
				required: ["type"]
			}
		}
	}));

	return await validate(result);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Validates typology to ensure it comes from organizations taxonomy.
 *
 * @param result Classification result from AI model
 * @returns Validated result with invalid typology removed
 */
async function validate(result: { type?: string }): Promise<{ type?: string }> {

	const organizations = "https://data.ec2u.eu/taxonomies/organizations/";

	if ( result.type ) {

		if ( await topics.lookup({ id: result.type, scheme: organizations }) ) {

			return result;

		} else {

			logger.warning`invalid typology <${result.type}> for scheme <${organizations}>`;

			return { type: undefined };

		}

	}

	return result;
}
