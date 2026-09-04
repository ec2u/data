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
import { Unit } from "@/units/index.js";
import { Type } from "@google/genai";
import { markdown } from "@metreeca/core/strings";
import { service } from "@metreeca/gear";

const tools = [
	fetchPage({ cache: pages.lookup(retrieve) })
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function analyze(lead: Partial<Unit>): Promise<Partial<Unit>> {

	return json<Partial<Unit>>(await service(createGoogleAI).models.generateContent({
		model: "gemini-2.5-flash",
		contents: markdown`
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
						description: markdown`
								Formal name of the research unit - MUST include explicit unit type descriptor
								(e.g., 'Laboratory of...', 'Department of...', 'Research Group on...')
							`
					},
					short: {
						type: Type.STRING,
						description: markdown`
								Short name of the research unit (OPTIONAL - omit if not actually found on website,
								or if it equals the formal name or acronym)
							`
					},
					acronym: {
						type: Type.STRING,
						description: markdown`
								Acronym of the research unit (OPTIONAL - omit if not actually found on website)
							`
					},
					identifier: {
						type: Type.STRING,
						description: markdown`
								Internal identifier of the research unit (OPTIONAL - omit if not found on website)
							`
					},
					email: {
						type: Type.STRING,
						description: markdown`
								Institutional email address of the research unit
								(OPTIONAL - omit if not actually found on website)
							`
					},
					summary: {
						type: Type.STRING,
						description: markdown`
								REQUIRED - Summary of the research unit (~500 chars) - NEVER omit this field
							`
					},
					description: {
						type: Type.STRING,
						description: markdown`
								General description in markdown format
							`
					},
					keywords: {
						type: Type.ARRAY,
						items: { type: Type.STRING },
						description: markdown`
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
