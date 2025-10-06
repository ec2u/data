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

import { defaults, Unit } from "@/services/units/shared";
import { md } from "@/utilities/core/tags";
import { ai, json } from "@/utilities/gcp/gemini";
import { Type } from "@google/genai";


export function structure(overview: string): Promise<Unit> {
	return ai().then(async ai => json<Unit>(await ai.models.generateContent({

		model: "gemini-2.5-flash-lite",

		config: {
			...defaults,
			systemInstruction: md`
				ROLE / You are an academic content manager specializing in research activities.
				
				INPUT / You will be provided with a document describing an academic research unit.
				
				GOAL / Your task is to convert it into a structured machine-redable representation.
				
				OUTPUT / Reply with a structured JSON object.
				
				INSTRUCTIONS
				
				- ALWAYS omit undefined scalar values
				- ALWAYS omit empty object values
				- ALWAYS omit empty array values
				
			`,
			responseMimeType: "application/json",
			responseSchema: {
				type: Type.OBJECT,
				properties: {
					formal: { type: Type.STRING, description: "Formal name of the research unit" },
					short: { type: Type.STRING, description: "Short name of the research unit" },
					acronym: { type: Type.STRING, description: "Acronym of the research unit" },
					identifier: { type: Type.STRING, description: "Unique identifier of the research unit" },
					email: { type: Type.STRING, description: "Institutional email address of the research unit" },
					summary: { type: Type.STRING, description: "Summary of the research unit (~500 chars)" },
					description: { type: Type.STRING, description: "General description in markdown format" },
					type: { type: Type.STRING, description: "Type or category of the research unit" },
					topics: {
						type: Type.ARRAY,
						items: { type: Type.STRING },
						description: "List of research topics and fields"
					},
					links: {
						type: Type.OBJECT,
						properties: {
							children: {
								type: Type.ARRAY,
								items: { type: Type.STRING },
								description: "URLs for sub-laboratories/research lines pages"
							}
						},
						required: ["children"]
					}
				},
				required: ["formal", "summary", "description", "type", "topics"]
			}
		},

		contents: overview

	})));
}
