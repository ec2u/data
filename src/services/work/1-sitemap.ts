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

import { crawl } from "@/utilities/core/fetch";
import { DatastoreCache } from "@/utilities/gcp/cache";
import { ai, text } from "@/utilities/gcp/gemini";
import dedent from "dedent";


crawl(
	// "https://microwave.unipv.it",
	// "https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale",
	"https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/",

	{

		depth: 2,
		tasks: 10,
		cache: DatastoreCache({ kind: "Page" }),

		summarist: ({ url, title, content }) => ai().then(async ai =>
			text(await ai.models.generateContent({
				model: "gemini-2.5-flash-lite",
				contents: dedent`
				---
				url: ${url}
				title: ${title}
				---
				
				${content}
			`,
				config: {
					seed: 0,
					temperature: 0,
					systemInstruction: dedent`ROLE / You are an academic content manager specializing in research activities.

INPUT / You will be provided with a page from a website describing an academic research
unit; page content is in markdown format and includes its URL and title in the frontmatter.

GOAL / Your task is to create an English summary of about 500 chars for the provided page.

OUTPUT / Reply with a plaintext paragraph.

INSTRUCTIONS / Make sure to:

- Identify the described unit
- Highlight the page role within the website
- Summarize directories, catalogues and other listings focusing on the definition of their contents,
  rather than enumerating items and their details
- NEVER include the page title in the summary
 `
				}
			}))
		)

	})

	.then(pages => pages

		.map(({ url, title, summary }) => dedent`
			url: ${url}
			title: ${title}
			summary: ${summary}
		`)

		.join("\n\n")
	)

	.then(console.log)
	.catch(console.error);
