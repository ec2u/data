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

import { fetchPage } from "@/services/units-fetch/tools";
import { dump, log } from "@/utilities/core/log";
import { pipe } from "@/utilities/core/pipe";
import { md } from "@/utilities/core/tag";
import { DatastoreCache } from "@/utilities/gcp/cache";
import { ai } from "@/utilities/gcp/gemini";


pipe(
	"https://iii.dip.unipv.it/"
	// "https://dbbs.dip.unipv.it/"
	// "https://dbbs.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/linee-e-temi-di-ricerca/unita-di-psicologia-dello-sviluppo-e"
	// "http://lag.unipv.it/en/" "http://psicologia.unipv.it/laboratori/lasc/163-lasc.html"

	// "https://giurisprudenza.dip.unipv.it/"
	// "https://dirittoesanita.unipv.it/"

	// "https://microwave.unipv.it"
	// "https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale"
	// "https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale/laboratorio-di-biotecnologie-vegetali"

	// "https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/"

	, {

		label: "units-fetch",
		cache: DatastoreCache({ kind: "Memo" })

	}
)

	.then(explore)

	.then(dump("work.md"))

	.then(console.info)
	.catch(console.error);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function explore(site: string): Promise<string> {

	const maxRounds=20;

	const client=await ai();

	const history: Array<{ role: string; parts: any }>=[
		{ role: "user", parts: [{ text: site }] }
	];

	const systemInstruction=md`

			ROLE / You are exploring an academic research unit website to gather comprehensive information.

			TASK / Explore the website starting from the provided URL. When you have gathered sufficient
			information, stop exploring and generate a comprehensive plaintext report.

			EXPLORATION STRATEGY

			- Start with the homepage
			- Look for pages about research topics, activities, organization structure
			- Prioritize pages mentioning child units, laboratories, research groups
			- Continue exploring until you have sufficient information to write a comprehensive report

			PARALLEL FETCHING

			- You can fetch MULTIPLE pages in parallel by calling fetchPage multiple times in a single turn
			- ALWAYS batch independent page requests together for efficiency
			- For example, if you see links to 5 child units, call fetchPage for all 5 at once
			- Do NOT fetch pages one at a time across multiple turns unless they depend on each other's results

			STOPPING CONDITIONS

			- Stop exploring when you have gathered enough information to describe:
			  - The unit's identity (name, acronym, email)
			  - Research topics and activities
			  - Child units or laboratories
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

			# Summary
			[Concise paragraph of about 500 chars]

			# General Description
			[Standalone description of about 250 words, 2-4 paragraphs]

			# Typology
			[Classification type, e.g., Department, Laboratory, Research Group]

			# Major Research Fields and Topics
			[Numbered list, no more than 10 items]

			# URLs for pages describing INDIVIDUAL child research units
			[Bulleted list of URLs, one per line]

		`;

	const tools={ // see https://ai.google.dev/gemini-api/docs/function-calling

		fetchPage: fetchPage()

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
					functionDeclarations: Object.values(tools).map(tool => Object.assign({}, tool))
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
