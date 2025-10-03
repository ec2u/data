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

import { fetchPage } from "@/services/units-fetch/gemini-tools";
import { log } from "@/utilities/core/log";
import { md } from "@/utilities/core/tag";
import { DatastoreCache } from "@/utilities/gcp/cache";
import { ai } from "@/utilities/gcp/gemini";

export async function explore(site: string): Promise<string> {

	const maxRounds=20;

	const client=await ai();

	const history: Array<{ role: string; parts: any }>=[
		{ role: "user", parts: [{ text: site }] }
	];

	const systemInstruction=md`

			ROLE / You are an academic content manager specializing in research activities.
			
			INPUT / You will be provided with the URL for the home page of a research unit website.
		
			TASK / Explore the website starting from the provided URL. When you have gathered sufficient
			information, stop exploring and generate a comprehensive plaintext report.

			EXPLORATION STRATEGY

			- Start with the homepage
			- Look for pages about research topics, activities, organization structure
			- Prioritize pages mentioning child units, laboratories, research groups and other related units
			- Continue exploring until you have sufficient information to write a comprehensive report
			- IGNORE pdfs and other linked documents

			URL ACCESS

			- ALWAYS retrieve relevant content from URLs where it is likely to be found, prioritizing
			  them against the goals of the analysis, taking into also their title and summary
			- Make ABSOLUTELY sure to access pages likely containing directories of child units
			- Make ABSOLUTELY sure to prioritize access to local language pages over their English translation

			PARALLEL FETCHING

			- You can fetch MULTIPLE pages in parallel by calling fetchPage multiple times in a single turn
			- ALWAYS batch independent page requests together for efficiency
			- For example, if you see links to 5 child units, call fetchPage for all 5 at once
			- Do NOT fetch pages one at a time across multiple turns unless they depend on each other's results

			STOPPING CONDITIONS

			- Stop exploring when you have gathered enough information to describe:
			  - The unit's identity (name, acronym, email)
			  - Research topics and activities
			  - Child (for instance, laboratories)
			  - Related research units (for instance, research centers)
			- After stopping exploration, generate a detailed plaintext report

			REPORT FORMAT

			When you decide to stop exploring, generate a plaintext report with the following structure:

			# Official Unit Name
			
			[The formal name]

			# Common or Short Name
			
			[Short name if defined, otherwise "Not defined"]

			# Acronym
			
			[Acronym if defined, otherwise "Not defined"]

			# Identifier
			
			[Internal identifier if defined, otherwise "Not defined"]

			# Institutional Email Address
			
			[Email if found, otherwise "Not defined"]

			# Typology
			
			[Classification type, for instance, Department, Laboratory, Research Group]

			# Summary
			
			[Concise paragraph of about 500 chars]

			# General Description
			
			[Standalone description of about 250 words, 2-4 paragraphs]

			# Major Research Fields and Topics
			
			[Bulleted list]

			# Child Research Units
			
			[Bulleted list of labelled URLs in markdown format ("[unit name](URL)"), one per line]

			# Related Research Units
			
			[Bulleted list of labelled URLs in markdown format ("[unit name](URL)"), one per line]

			CRITICAL PRIVACY REQUIREMENTS

			- You are STRICTLY FORBIDDEN to INCLUDE ANY personal information about staff,
			  researchers, collaborators, faculty members, directors, or any other individuals

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
			- try to remove anti-spam cloaking, for instance "name(at)exmple.edu"

			TYPE GUIDELINES

			- ALWAYS include a unit type for classification purpose

			TOPICS GUIDELINES

			- Keep the list as SHORT as possible, but make sure that all relevant topics are included
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

			WRITING STYLE

			- Use a neutral, objective tone, without hype and emphasis
			- Write original content; do not copy text verbatim from source pages
			- Don't use abbreviations ("for instance" rather than "e.g.")

			CHILD AND RELATED UNITS

			- Make ABSOLUTELY sure to propery classify linked research units, thoroughly inspecting available
			information for parent/child or horizontal relationships
			  - List as child ONLY units that are structurally part of the focus unit
			  - List as related ONLY units the focus units collaborates WITH
			- Make ABSOLUTELY sure to report EVERY unit that has a linked homepage
			- IGNORE units mentioned only by name, without links
			- Make ABSOLUTELY sure to report all entries found in unit directories formatted as tables
			  or lists without textual descriptions
			- Make ABSOLUTELY sure to report URLs verbatim

		`;

	const tools={ // see https://ai.google.dev/gemini-api/docs/function-calling

		fetchPage: fetchPage({ cache: DatastoreCache({ kind: "Page" }) })

	};


	for (let round=0; round < maxRounds; round++) {

		const response=await client.models.generateContent({
			model: "gemini-2.5-flash",
			contents: history,
			config: {
				seed: 0,
				temperature: 0,
				systemInstruction,
				tools: [{
					functionDeclarations: Object.values(tools).map(tool => tool.declaration)
				}]
			}
		});


		const parts=response.candidates?.[0]?.content?.parts;

		if ( parts ) {
			if ( response.functionCalls && response.functionCalls.length > 0 ) {

				history.push(
					{ role: "model", parts },
					{
						role: "function", parts: await Promise.all(
							response.functionCalls!.map(async (call) => {

								const tool=tools[call.name as keyof typeof tools];

								if ( tool ) {

									log.info(explore.name, `calling ${call.name}(${JSON.stringify(call.args)})`);

									return {
										functionResponse: {
											name: call.name,
											response: await tool(call.args as any)
										}
									};

								} else {

									log.warn(explore.name, `unknown function: ${call.name}`);

									return {
										functionResponse: {
											name: call.name,
											response: { error: `Unknown function: ${call.name}` }
										}
									};

								}

							})
						)
					}
				);

			} else {

				const text=parts
					.filter(part => "text" in part && part.text)
					.map(part => part.text);

				if ( text.length > 0 ) {
					return text.join("\n");
				}

			}

		}

	}

	throw new Error(`safety limit reached (${maxRounds} rounds of function calling)`);

}
