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
import { topics } from "@/pipelines/topics/store";
import { matchTopics } from "@/pipelines/topics/tools/matchTopics";
import { Lead, Unit } from "@/pipelines/units";
import { ai, data, text } from "@/utilities/gcp/gemini";
import { file } from "@/utilities/node/files";
import { Type } from "@google/genai";


const tools=[
	fetchPage({ cache: pages.lookup }),
	matchTopics({ topics: scheme => topics.select({ scheme }) })
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function analyze(lead: Lead): Promise<string> {
	return text(await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents: JSON.stringify(lead, null, 2),
		config: {
			seed: 0,
			temperature: 0,
			systemInstruction: await file("index.ai", import.meta.url),
			tools,
			automaticFunctionCalling: {
				maximumRemoteCalls: 20
			}
		}
	}));
}

export async function structure(report: string): Promise<Unit> {
	return data(report, {
		type: Type.OBJECT,
		properties: {
			formal: {
				type: Type.STRING,
				description: "Formal name of the research unit"
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
				description: "Formal topic ID from the organizations taxonomy"
			},
			topics: {
				type: Type.ARRAY,
				items: { type: Type.STRING },
				description: "List of formal research topic IDs"
			},
			summary: {
				type: Type.STRING,
				description: "Summary of the research unit (~500 chars)"
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
}
