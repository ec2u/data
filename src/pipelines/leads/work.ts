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

import { Unit } from "@/pipelines/units";
import { md } from "@/utilities/core/tags";
import { DatastoreCache } from "@/utilities/gcp/cache";
import { ai, json, text } from "@/utilities/gcp/gemini";
import { dump, file } from "@/utilities/node/files";
import { fetchPage } from "@/utilities/work/gemini-tools";
import { Type } from "@google/genai";


Promise.resolve(
		// "https://iii.dip.unipv.it/"
		// "https://microwave.unipv.it"

		// "https://dbbs.dip.unipv.it/"
		// "https://dbbs.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/linee-e-temi-di-ricerca/unita-di-statistica-medica-e-genomica"
		// "http://lag.unipv.it/en/" "http://psicologia.unipv.it/laboratori/lasc/163-lasc.html"

		// "https://giurisprudenza.dip.unipv.it/"
		// "https://dirittoesanita.unipv.it/"

		"https://dbb.dip.unipv.it/it"
		// "https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale"
		// "https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale/laboratorio-di-biotecnologie-vegetali"

		// "https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/"

	)

	.then(explore).then(dump("work.md"))
	.then(structure).then(dump("work.json"))

	.then(console.info)
	.catch(console.error);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function explore(site: string): Promise<string> {

	return ai().then(async ai => text(await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents: site,
		config: {
			seed: 0,
			temperature: 0,
			systemInstruction: await file("./1-analyze.md", import.meta.url),
			tools: [
				fetchPage({ cache: DatastoreCache({ kind: "Page" }) })
			],
			automaticFunctionCalling: {
				maximumRemoteCalls: 20
			}
		}
	})));

}


export function structure(overview: string): Promise<Unit> {
	return ai().then(async ai => json(await ai.models.generateContent({
		model: "gemini-2.5-flash-lite",
		contents: overview,
		config: {
			seed: 0,
			temperature: 0,
			systemInstruction: md`
			
				ROLE / You are an academic content manager specializing in research activities.
				
				INPUT / You will be provided with a document describing an academic research unit.
				
				GOAL / Your task is to convert it into a structured machine-readable representation.
				
				OUTPUT / Reply with a structured JSON object.
								
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
					type: { type: Type.STRING, description: "Type or category of the research unit" },
					summary: { type: Type.STRING, description: "Summary of the research unit (~500 chars)" },
					description: { type: Type.STRING, description: "General description in markdown format" },
					topics: {
						type: Type.ARRAY,
						items: { type: Type.STRING },
						description: "List of research topics and fields"
					}
				},
				required: ["formal", "type", "summary", "description", "topics"]
			}
		}
	})));
}
