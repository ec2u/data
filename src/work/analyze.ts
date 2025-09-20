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

import { ai, json } from "@/gcp/gemini";
import { content, get, html, Link, links } from "@/work/fetch";
import { Type } from "@google/genai";
import dedent from "dedent";


interface Input {

	readonly home: string;
	readonly description: string;

	readonly url: string;
	readonly title: string;
	readonly body: string;
	readonly links: readonly Link[];

}

interface Output {

	page?: {

		role:

			"description"
			| "topics"
			| "members"
			| "facilities"
			| "publications"
			| "parent"
			| "child"

		summary: string

	};

	next?: string[];

}


const home="https://fisica.dip.unipv.it/";
const description="Physics Department at University of Pavia";

Promise.resolve(home)

	.then(get)
	.then(html)

	.then(async dom => {

		const contentData=await content(dom);
		const linkData=await links(dom);

		console.log(linkData);

		return {
			home,
			description,
			url: contentData.url,
			title: contentData.title || "",
			body: contentData.contentMarkdown || "",
			links: linkData
		};
	})

	.then(async input => ai().then(async ai => json(await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents: JSON.stringify(input, null, 2),
		config: {
			systemInstruction: dedent`

			Your task is to analyse a page from a website describing an academic research unit, with the eventual goal of generation
an annotated sitemap for further processing.

You will be provided with an input JSON object structured according to the following typescript interface:

\`\`\`typescript
interface Input {

	home: string;           // URL of the unit home page
	description: string;    // brief description of the unit

	url: string;            // page URL
	title: string;          // page title
	body: string;           // page body in markdown format (excluding site navigation or other boilerplate)
	links: Link[];          // page links (including links from site navigation or other boilerplate)

}

interface Link {

	href: string            // URL of the linked page
	text?: string           // linking text

}
\`\`\`

Reply with a JSON object structured according to the following typescript interface:

\`\`\`typescript
interface Output {

	// page analysis
	// generate only if the current page is VERY likely to belong to the website of the unit

	page?: {

		role: // page role in the context of the website of the unit 

			"description"       // general description of the unit
			| "topics"          // description of the research topics of the unit
			| "members"         // directory of the members the unit
			| "facilities"      // cataogue of the research facilities / instruments available to the unit
			| "publications"    // catalogue of the research publications by members of the unit
			| "parent"          // homepage of the website for the parent unit (for instance, the dept of the lab)
			| "child"           // homepage of the website for a child unit (for instance, tone of the labs of the dept)
        
        summary: string // page summary of about 500 chars

	};

	// URLs of linked pages likely to belong to the website of the unit or one of its parent/children units
	// generate only if not empty

	next?: string[];

}
\`\`\`

Take ALWAYS into account the following CRITICAL issues:

- **layout variability** / unit websites may be structured in different ways:
    - **single-page**: all information contained on homepage
    - **multi-page**: landing page with dedicated subpages for specific information,
      with relevant content potentially distributed across multiple interconnected pages
- **embedding** / unit websites could be embedded within a larger site (for instance, multiple pages describing a
  laboratory and its facilities in the context of a department website)
- **unstructured URLs** / URLs are not required to have a hierarchical structure ( for instance, CMS-generated URLs like
  \`https://example.edu/page=123\`)
- **mixed navigation links** / linked pages could include relevant subpages mixed with external resources and parent
  institution links included in page templates
`,
			responseMimeType: "application/json",
			responseSchema: {
				type: Type.OBJECT,
				properties: {
					page: {
						type: Type.OBJECT,
						properties: {
							role: {
								type: Type.STRING,
								description: "The role/type of this page",
								enum: ["description", "topics", "members", "facilities", "publications", "parent", "child"]
							},
							summary: {
								type: Type.STRING,
								description: "Page summary of about 500 characters"
							}
						},
						required: ["role", "summary"]
					},
					next: {
						type: Type.ARRAY,
						items: {
							type: Type.STRING
						},
						description: "URLs of linked pages likely belonging to the website of the unit or its parent/children units"
					}
				}
			}
		}
	}))))

	.then(console.info)
	.catch(console.error);
