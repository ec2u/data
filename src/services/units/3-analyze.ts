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

import { defaults } from "@/services/units/index";
import { Page } from "@/utilities/core/fetch";
import { md } from "@/utilities/core/tag";
import { ai, json } from "@/utilities/gcp/gemini";
import { Type } from "@google/genai";
import dedent from "dedent";


// !!! `university`: Institution affiliation from closed set of 9 European universities
// !!! `formal_name`: Official unit designation
// !!! `short_name`: Common abbreviated name
// !!! `identifier`: Unit acronym or code
// !!! `type`: Classification from reference taxonomy


interface Unit {

	readonly name: string;
	readonly email: string;
	readonly summary: string;
	readonly description: string;

	readonly topics: readonly string[];

	readonly links: {

		readonly publications: readonly string[];
		readonly facilities: readonly string[];
		readonly children: readonly string[];

	};

}


export function analyze(pages: readonly Page[]): Promise<Unit> {
	return ai().then(async ai => json<Unit>(await ai.models.generateContent({

		model: "gemini-2.5-flash-lite",

		config: {
			...defaults,
			systemInstruction: md`
				ROLE / You are an academic content manager specializing in research activities.
				
				INPUT / You will be provided with a collated collection of pages from a website
				describing an academic research unit. Each entry includes:
				
				- the page URL and page title in a front matter section
				- the page content in markdown format
				
				GOAL / Your task is to identify the following information about the unit AS A WHOLE:
				
				- name of the research unit
				- INSTITUTIONAL email address of the research unit
				- summary of the research unit (a concise paragraph of about 500 chars)
				- general description of the research unit in markdown format (no more than a page of
				  text, using STRICTLY ONLY H1 (#) headings)
				- a list of research topics and fields of the unit
				- a list of URLs for pages describing research publications from the unit
				- a list of URLs for pages describing instrumentation and other facilities, including
				  specialised software
				- a list of URLs for pages describing sub-laboratories, research lines, or specialized
				  facilities within the unit
				
				OUTPUT / Reply with a structured JSON object
				
				CRITICAL PRIVACY REQUIREMENTS:
				
				- You are STRICTLY FORBIDDEN to INCLUDE ANY personal information about staff,
				  researchers, collaborators, faculty members, directors, or any other individuals
				
				WRITING GUIDELINES:
				
				- Generate an ENGLISH standalone unit name that can uniquely identify it out of
				  context, INCLUDING the unit typology
				- ALWAYS refer to the unit by name
				- Focus ONLY on the research unit itself, its activities, facilities, and scientific
				  objectives
				- Make sure that summary and description highlight the research topics of the unit
				- Write original content; do not copy text verbatim from source pages (avoid phrases
				  like "Welcome to...")
				- Ensure the description reads as a standalone document that can be understood out of
				  context
				
				DESCRIPTION STRUCTURE:
				
				- NEVER include a document title
				- NEVER use the unit name as any form of heading or title in the description
				- Start the description directly with content sections using descriptive H1 headings
				
				LINKING REQUIREMENTS:
				
				- Make ABSOLUTELY sure to ignore personal email addresses
				- Make ABSOLUTELY sure to report the institutional email address only if ACTUALLY found
				  in one of the pages
				- Make ABSOLUTELY sure that the linked pages ACTUALLY contain the expected content
			`,
			responseMimeType: "application/json",
			responseSchema: {
				type: Type.OBJECT,
				properties: {
					name: { type: Type.STRING, description: "Name of the research unit" },
					email: { type: Type.STRING, description: "Institutional email address of the research unit" },
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
				required: ["name", "email", "summary", "description", "topics", "links"]
			}
		},

		contents: pages

			.map(({ url, title, content }) => dedent`
				---
				url: ${url}
				title: ${title}
				---
				
				${content}
			`)

			.join("\n\n\n")

	})));
}
