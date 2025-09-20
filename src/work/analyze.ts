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

import { content, get, html } from "@/core/fetch";
import { ai, json } from "@/gcp/gemini";
import { Type } from "@google/genai";
import dedent from "dedent";


interface Input {

	readonly home: string;
	readonly description: string;

	readonly url: string;
	readonly title: string;
	readonly body: string;

}

interface Output {

	role: null

		| "description"
		| "topics"
		| "members"
		| "facilities"
		| "publications"
		| "parent"
		| "child";

	summary: string;

}


const home="https://fisica.dip.unipv.it/";
const description=`This is the Italian homepage of the Physics Department "Alessandro Volta" at the University of Pavia. It provides a general description of the unit, detailing its mission to promote and coordinate extensive research across various physics fields and to manage Bachelor's, Master's, and PhD degree programs. The page highlights recent news and achievements, showcasing awards received by its members and the department's involvement in significant scientific projects, such as the Breakthrough Prize and muon beam detector development. Additionally, it offers academic information for prospective students, outlining available degree options, and features testimonials from alumni about their career successes.`;

Promise.resolve("https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-sperimentale-della-materia")

	.then(get)
	.then(html)

	.then(async dom => {

		const data=await content(dom);

		return {
			home,
			description,
			url: data.url,
			title: data.title || "",
			body: data.contentMarkdown || ""
		};
	})

	.then(async input => ai().then(async ai => json(await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents: JSON.stringify(input, null, 2),
		config: {
			systemInstruction: dedent`Your task is to analyse a page from a website describing an academic research unit, with the eventual goal of generation
an annotated sitemap for further processing.

You will be provided with an input JSON object structured according to the following typescript interface:

\`\`\`typescript
interface Input {

	home: string;           // URL of the unit home page
	description: string;    // brief description of the unit

	url: string;            // page URL
	title: string;          // page title
	body: string;           // page body in markdown format (excluding site navigation or other boilerplate)

}
\`\`\`

Reply with a JSON object structured according to the following typescript interface:

\`\`\`typescript
interface Output {

	role: // page role in the context of the website of the unit 

		null           		// content doesn't belong to the unit website

		| "description"     // general description of the unit
		| "topics"          // description of the research topics of the unit
		| "members"         // directory of the members the unit
		| "facilities"      // cataogue of the research facilities / instruments available to the unit
		| "publications"    // catalogue of the research publications by members of the unit
		| "parent"          // homepage of the website for the parent unit (for instance, the dept of the lab)
		| "child";           // homepage of the website for a child unit (for instance, tone of the labs of the dept)

	summary: string; // page summary of about 500 chars

}
\`\`\``,
			responseMimeType: "application/json",
			responseSchema: {
				type: Type.OBJECT,
				properties: {
					role: {
						description: "The role/type of this page",
						oneOf: [
							{ type: Type.NULL },
							{
								type: Type.STRING,
								enum: [
									"description", "topics", "members", "facilities",
									"publications", "parent", "child"
								]
							}
						]
					},
					summary: {
						type: Type.STRING,
						description: "Page summary of about 500 characters"
					}
				},
				required: ["role", "summary"]
			}
		}
	}))))

	.then(console.info)
	.catch(console.error);
