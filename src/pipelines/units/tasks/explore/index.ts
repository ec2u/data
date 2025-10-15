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
import { Unit } from "@/pipelines/units";
import { md } from "@/utilities/core/tags";
import { ai, data } from "@/utilities/gcp/gemini";
import { file } from "@/utilities/node/files";
import { Type } from "@google/genai";


const tools=[
	fetchPage({ cache: pages.lookup })
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function explore(lead: Partial<Unit>): Promise<readonly Partial<Unit>[]> {
	return data(await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents: md`
			profile: ${lead.profile ?? "Not provided"}
			website: ${lead.website ?? "Not provided"}
			formal: ${lead.formal ?? "Not provided"}
			short: ${lead.short ?? "Not provided"}
			acronym: ${lead.acronym ?? "Not provided"}
			summary: ${lead.summary ?? "Not provided"}
		`,
		config: {
			seed: 0,
			temperature: 0,
			systemInstruction: await file(".ai", import.meta.url),
			tools,
			automaticFunctionCalling: {
				maximumRemoteCalls: 20
			}
		}
	}), {
		type: Type.ARRAY,
		items: {
			type: Type.OBJECT,
			properties: {
				profile: {
					type: Type.STRING,
					description: "The URL of the institutional profile of the unit (omit if not available)"
				},
				website: {
					type: Type.STRING,
					description: "The URL of the unit's self-managed website (omit if not available)"
				},
				formal: {
					type: Type.STRING,
					description: "The formal name of the research unit"
				},
				short: {
					type: Type.STRING,
					description: "The short name of the research unit (omit if not available)"
				},
				acronym: {
					type: Type.STRING,
					description: "The acronym of the research unit (omit if not available)"
				},
				summary: {
					type: Type.STRING,
					description: "A brief summary of the research unit"
				}
			},
			required: ["formal", "summary"]
		}
	});
}
