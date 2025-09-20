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

import { get, html, Link, links } from "@/core/fetch";
import { ai, json } from "@/gcp/gemini";
import { Type } from "@google/genai";
import dedent from "dedent";


interface Input {

	readonly home: string;
	readonly description: string;

	url: string;
	title: string;
	summary: string;
	links: Link[];

}

interface Output {

	readonly links: readonly string[];

}


const home="https://fisica.dip.unipv.it/";
const description=`This is the Italian homepage of the Physics Department "Alessandro Volta" at the University of Pavia. It provides a general description of the unit, detailing its mission to promote and coordinate extensive research across various physics fields and to manage Bachelor's, Master's, and PhD degree programs. The page highlights recent news and achievements, showcasing awards received by its members and the department's involvement in significant scientific projects, such as the Breakthrough Prize and muon beam detector development. Additionally, it offers academic information for prospective students, outlining available degree options, and features testimonials from alumni about their career successes.`;

Promise.resolve(home)

	.then(get)
	.then(html)

	.then(async dom => {

		const data=await links(dom);

		return {
			home,
			description,
			url: home,
			title: "Home page IT | Dipartimento di Fisica \"Alessandro Volta\"",
			summry: description,
			links: data
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
	summary: string;        // page summary
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

	// URLs of linked pages likely to belong to the website of the unit or one of its parent/children units

	links: string[];

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

You MUST select URLs if they meet ANY of these criteria:

## ALWAYS Include:

- URLs that share the same domain/subdomain as the unit's home page AND contain content specifically
  related to the unit (research, teaching, members, facilities) - NOT generic administrative pages
- Pages about research topics, groups, or areas (e.g., "research lines", "research groups")
- Member directories or staff pages (e.g., "faculty", "people", "members")
- Facility or equipment descriptions (e.g., "facilities", "laboratories", "instruments")
- Publication lists or research output pages
- Course or teaching pages when part of an academic unit
- Parent unit pages (department pages for labs, university pages for departments)
- Child unit pages (lab pages within departments)

## Language Variants:

- Include URLs that are language variants of the same content (e.g., \`/en/\` vs \`/it/\` versions)
- These are often highly relevant even if they duplicate content

## Examples of URLs to Include:

- \`https://fisica.dip.unipv.it/it/didattica/corsi-di-laurea\` (degree courses)
- \`https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca\` (research lines)
- \`https://fisica.dip.unipv.it/en/\` (English version)
- \`https://physics.university.edu/faculty/\` (faculty directory)
- \`https://lab.physics.edu/equipment/\` (equipment pages)

## Do NOT Include:

- External social media links
- General university administrative pages unrelated to the unit (even if same domain)
- External journal or database links
- Generic contact or location pages without unit-specific content
- CMS-generated or unstructured URLs that don't clearly relate to the unit's activities

## Special Note on Unstructured URLs:

For CMS-generated URLs like \`https://example.edu/page=123\`, evaluate the CONTENT and linking text,
not just the domain. Include only if the content clearly relates to the specific unit being analyzed.
`,
			responseMimeType: "application/json",
			responseSchema: {
				type: Type.OBJECT,
				properties: {
					links: {
						type: Type.ARRAY,
						items: {
							type: Type.STRING
						},
						description: "Array of URLs for further processing"
					}
				},
				required: ["links"]
			}
		}
	}))))

	.then(console.info)
	.catch(console.error);
