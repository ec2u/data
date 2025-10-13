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

import { fetchPage } from "@/pipelines/pages/tools/fetchPage";
import { DatastoreCache } from "@/pipelines/pages/work/store";
import { Lead } from "@/pipelines/units";
import { ai, data, text } from "@/utilities/gcp/gemini";
import { file } from "@/utilities/node/files";
import { Type } from "@google/genai";


const tools=[
	fetchPage({ cache: DatastoreCache({ kind: "Page" }) })
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function explore(lead: Lead): Promise<string> {
	return text(await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents: JSON.stringify(lead, null, 2),
		config: {
			seed: 0,
			temperature: 0,
			systemInstruction: await file("index.llm", import.meta.url),
			tools,
			automaticFunctionCalling: {
				maximumRemoteCalls: 20
			}
		}
	}));
}

export async function structure(report: string): Promise<readonly Lead[]> {
	return data(report, {
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
				name: {
					type: Type.STRING,
					description: "The name of the research unit"
				},
				summary: {
					type: Type.STRING,
					description: "A brief summary of the research unit"
				}
			},
			required: ["name", "summary"]
		}
	});
}
