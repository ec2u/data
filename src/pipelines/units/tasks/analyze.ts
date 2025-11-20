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

import { md } from "@/metreeca/core/tags";
import { ai, json } from "@/metreeca/gcp/gemini";
import { file } from "@/metreeca/node/files";
import { pages } from "@/pipelines/pages/store";
import { fetchPage } from "@/pipelines/pages/tools/fetchPage";
import { Unit } from "@/pipelines/units";
import { Type } from "@google/genai";

const tools = [
	fetchPage({ cache: pages.lookup })
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function analyze(lead: Partial<Unit>): Promise<Partial<Unit>> {

	return json<Partial<Unit>>(await ai.models.generateContent({
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
				maximumRemoteCalls: 100
			},
			responseMimeType: "application/json",
			responseSchema: {
				type: Type.OBJECT,
				properties: {
					formal: {
						type: Type.STRING,
						description: md`
								Formal name of the research unit - MUST include explicit unit type descriptor
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
								Internal identifier of the research unit (OPTIONAL - omit if not found on website)
							`
					},
					email: {
						type: Type.STRING,
						description: md`
								Institutional email address of the research unit
								(OPTIONAL - omit if not actually found on website)
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
								List of keywords describing research areas and fields
							`
					}
				},
				required: [
					"formal",
					"summary",
					"description",
					"keywords"
				]
			}
		}
	}));

}
