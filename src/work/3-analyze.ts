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

import { Page } from "@/core/fetch";
import { log, message } from "@/core/log";
import { DatastoreCache } from "@/gcp/cache";
import { ai, json } from "@/gcp/gemini";
import { Type } from "@google/genai";
import dedent from "dedent";


interface Output {

	readonly name: string;
	readonly summary: string;
	readonly description: string;

	readonly topics: readonly string[];

	readonly links: {

		readonly publications: readonly string[];
		readonly facilities: readonly string[];
		readonly children: readonly string[];

	};

}


const microwave=[
	"https://microwave.unipv.it/software-download/",
	"https://microwave.unipv.it/research-fields/"
];

const biology=[
	"https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale",
	"https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale/laboratorio-di-biotecnologie-vegetali",
	"https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale/biophotolab",
	"https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale/seed-molecular-physiology-lab"
];

const power=[
	"https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/",
	"https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/ueber-uns/",
	"https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/forschung/publikationen/",
	"https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/forschung/erc-forschung/",
	"https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/news-events/detail/news/neues-forschungsprojekt-am-institut-fuer-elektrische-antriebe-und-leistungselektronik-advanced-technologies-for-fuel-cell-subsystem-compressors/"
];


function analyze() {}


Promise.resolve(
		// microwave
		biology
		// power
	)

	.then(async urls => {

		const cache=DatastoreCache<Page>({ kind: "Page" });

		return await Promise.all(
			urls.map(url => cache.lookup(url).catch(error => {

				log.error(analyze.name, `unable to look up <${url}>: ${message(error)}`);

				throw error;

			}))
		);

	})


	.then(pages => pages

		.map(({ url, title, content }) => dedent`
				---
				url: ${url}
				title: ${title}
				---
				
				${content}
			`)

		.join("\n\n\n")
	)


	.then(async input => {
		return ai().then(async ai => json<Output>(await ai.models.generateContent({
			model: "gemini-2.5-flash-lite",
			contents: input,
			config: {
				seed: 0,
				temperature: 0,
				systemInstruction: dedent`ROLE / You are an academic content manager specializing in research activities.

INPUT / You will be provided with a collated collection of pages from a website describing an academic research unit. Each entry includes:

- the page URL and page title in a front matter section
- the page content in markdown format

GOAL / Your task is to identify the following information about the unit AS A WHOLE:

- name of the research unit
- summary of the research unit (a concise paragraph of about 500 chars)
- general description of the research unit in markdown format (no more than a page of text, using STRICTLY ONLY H1 (#) headings)
- a list of research topics and fields of the unit
- a list of URLs for pages describing research publications from the unit
- a list of URLs for pages describing  instrumentation and other facilities, including specialised software
- a list of URLs for pages describing sub-laboratories, research lines, or specialized facilities within the unit

OUTPUT / Reply with a structured JSON object

CRITICAL PRIVACY REQUIREMENTS:

- You are STRICTLY FORBIDDEN to INCLUDE ANY personal information about staff, researchers, collaborators,
  faculty members, directors, or any other individuals

WRITING GUIDELINES:

- Generate an ENGLISH standalone unit name that can uniquely identify it out of context, INCLUDING the unit typology
- ALWAYS refer to the unit by name
- Focus ONLY on the research unit itself, its activities, facilities, and scientific objectives
- Make sure that summary and description highlight the research topics of the unit
- Write original content; do not copy text verbatim from source pages (avoid phrases like "Welcome to...")
- Ensure the description reads as a standalone document that can be understood out of context

DESCRIPTION STRUCTURE:

- NEVER include a document title
- NEVER use the unit name as any form of heading or title in the description
- Start the description directly with content sections using descriptive H1 headings

LINKING REQUIREMENTS:

- Make ABSOLUTELy sure that the linked pages ACTUALLY contain the expected content
`,
				responseMimeType: "application/json",
				responseSchema: {
					type: Type.OBJECT,
					properties: {
						name: { type: Type.STRING, description: "Name of the research unit" },
						summary: { type: Type.STRING, description: "Summary of the research unit (~500 chars)" },
						description: { type: Type.STRING, description: "General description in markdown format" },
						topics: {
							type: Type.ARRAY,
							items: { type: Type.STRING },
							description: "List of research topics and fields"
						},
						links: {
							type: Type.OBJECT,
							properties: {
								publications: {
									type: Type.ARRAY,
									items: { type: Type.STRING },
									description: "URLs for research publications pages"
								},
								facilities: {
									type: Type.ARRAY,
									items: { type: Type.STRING },
									description: "URLs for instrumentation/facilities pages"
								},
								children: {
									type: Type.ARRAY,
									items: { type: Type.STRING },
									description: "URLs for sub-laboratories/research lines pages"
								}
							},
							required: ["publications", "facilities", "children"]
						}
					},
					required: ["name", "summary", "description", "topics", "links"]
				}
			}
		})));
	})

	.then(console.info)
	.catch(console.error);
