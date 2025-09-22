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

import { crawl } from "@/core/fetch";
import { DatastoreCache } from "@/gcp/cache";
import { ai, text } from "@/gcp/gemini";
import dedent from "dedent";


crawl("https://microwave.unipv.it", {

	depth: 1,
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
				systemInstruction: dedent`You are an academic content manager specializing in research activities.

Your task is to create an English summary of about 500 chars for a page from a website describing an academic research
unit.

Page content is provided in markdown format and includes its URL and title in the frontmatter.

Reply with a plaintext paragraph.

Make sure to:

- Identify the described unit
- Highlight the page role within the website
- Summarize directories, catalogues and other listings focusing on the definition of their contents,
  rather than enumerating items and their details
- ALWAYS translate title and other excerpts from the page content, rather than including them verbatim

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
