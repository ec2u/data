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

import { defaults } from "@/services/units/shared";
import { Page } from "@/utilities/core/fetch";
import { md } from "@/utilities/core/tags";
import { ai, text } from "@/utilities/gcp/gemini";
import { estimateResponseCost, formatCostBreakdown } from "@/utilities/gcp/gemini-cost";


export function analyze(pages: readonly Page[]): Promise<string> {
	return ai().then(async ai => {
		const response=await ai.models.generateContent({

			model: "gemini-2.5-flash",

			config: {

				...defaults,

				tools: [{ urlContext: {} }],

				systemInstruction: md`
				
					ROLE / You are an academic content manager specializing in research activities.
					
					INPUT / You will be provided with an annotated sitemap for a website describing an academic
					research unit, formatted as a markdown list, with the first item describing the homepage of
					the website. Each item includes:
					
					- the page URL and page title as a markdown link
					- a brief excerpt of the page content
					
					GOAL / Your task is to identify the following information about the unit AS A WHOLE:
					
					- the official unit name
					- the common or short name of the unit, ONLY if defined and EXCLUDING acronyms
					- the acronym of the unit, ONLY if defined
					- the identifier of the unit, ONLY if defined
					- the INSTITUTIONAL email address
					- a summary, as a concise paragraph (about 500 chars)
					- a general description, as a markdown document (about 250 words, no more than 4 paragraphs)
					- the typology of the unit, for classification purposes
					- a list of major research fields and topics (STRICTLY no more than 10)
					- a list of URLs for pages describing INDIVIDUAL child research units
					
					OUTPUT / Reply with a detailed textual analysis in markdown format, reporting the requested
					information in the given order and under clear and CONCISE H1 headings.
					
					CRITICAL PRIVACY REQUIREMENTS
					
					- You are STRICTLY FORBIDDEN to INCLUDE ANY personal information about staff,
					  researchers, collaborators, faculty members, directors, or any other individuals
					
					URL ACCESS
					
					- ALWAYS retrieve relevant content from URLs where it is likely to be found, prioritizing
					them against the goals of the analysis, taking into also their title and summary
					- Make ABSOLUTELY sure to access pages likely containing directories of child units
					- Make ABSOLUTELY sure to prioritize access to local language pages over their English translation

					NAME GUIDELINES
					
					- ALWAYS include a standalone unit name that can uniquely identify it out of context
					- ALWAYS include the unit typology in the name
					- NEVER include references to the university or to parent units
					- NEVER report an official name as short name
					- NEVER report an acronym as short name
					- ALWAYS translate names to ENGLISH
					
					IDENTIFIER GUIDELINES
					
					- Consider ONLY internal identifiers; NEVER report external identifiers, for instance VAT numbers 
					
					EMAIL GUIDELINES
					
					- NEVER report the institutional email address only if not ACTUALLY found in one of the pages
				    - NEVER use a PERSONAL email address as INSTITUTIONAL email address for the unit; in doubt omit it
				    
				    TYPE GUIDELINES
				    
				    - ALWAYS include a unit type for classification purpose
				    
				    TOPICS GUIDELINES
				    
				    - Keep the list as SHORT as sensible, but NOT shorter
				    - Focus on MAJOR topics, but highlight NOTEWORTHY specialty topics
				    - Sort topics by INCREASING specificity
				    
				    SUMMARY AND DESCRIPTION GUIDELINES
					
					- ALWAYS refer to the unit by the ENGLISH translation of its name
					- Focus ONLY on the research unit itself, its activities, facilities, and scientific objectives
					- Make sure that summary and description highlight the research topics of the unit
					- NEVER discuss the activities of child research units

					DESCRIPTION GUIDELINES
					
					- NEVER use headings to structure the description
					- Ensure that the description reads as a standalone document that can be understood out of context
					
					CHILD UNIT URLS
					
					- Make ABSOLUTELY sure to report EVERY child units that has a linked homepage
					- Make ABSOLUTELY sure to report all entries found in unit directories formatted as tables
					  or lists without textual descriptions
					- Make ABSOLUTELY sure to report URLs verbatim
					- IGNORE child units mentioned only by name, without links
					
					WRITING STYLE
					
					- Use a neutral, objective tone, without hype and emphasis
					- Write original content; do not copy text verbatim from source pages
					- Don't use abbreviations ("for instance" rather than "e.g.")

			`
			},

			contents: pages
				.map(page => `- [${page.title}](${page.url})\n  ${page.summary}`)
				.join("\n\n")

		});

		console.log(JSON.stringify(response.candidates?.[0].urlContextMetadata, null, 4));
		console.log(JSON.stringify(response.usageMetadata, null, 4));

		const costBreakdown=estimateResponseCost(response);
		if ( costBreakdown ) {
			console.log(formatCostBreakdown(costBreakdown));
		}

		return text(response);
	});
}
