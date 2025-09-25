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
import { crawl, Page } from "@/utilities/core/fetch";
import { md } from "@/utilities/core/tag";
import { DatastoreCache } from "@/utilities/gcp/cache";
import { ai, text } from "@/utilities/gcp/gemini";

/**
 * Explores an academic research website by crawling pages and generating AI-powered summaries.
 *
 * <p>Performs a depth-limited crawl of the specified site to discover academic research unit pages,
 * then uses Gemini AI to generate concise summaries of each page's content. The function focuses
 * on identifying research units and their roles within the website structure, with intelligent
 * caching to optimize performance across multiple exploration sessions.</p>
 *
 * @param site the base URL of the academic website to explore
 *
 * @returns a promise resolving to an array of crawled pages with AI-generated summaries
 */
export function explore(site: string): Promise<readonly Page[]> {
	return crawl(site, {

		depth: 2,
		tasks: 10,
		cache: DatastoreCache({ kind: "Page" }),

		summarist: ({ url, title, content }) => ai().then(async ai =>
			text(await ai.models.generateContent({
				model: "gemini-2.5-flash-lite",
				config: {
					...defaults,
					systemInstruction: md`
                        ROLE / You are an academic content manager specializing in research activities.

                        INPUT / You will be provided with a page from a website describing an academic research
                        unit; page content is in markdown format and includes  URL and title in the frontmatter.

                        GOAL / Your task is to create an English summary of about 500 chars for the provided page.

                        OUTPUT / Reply with a plaintext paragraph.

                        INSTRUCTIONS / Make sure to:

                        - Identify the described unit
                        - Highlight the page role within the website
                        - Summarize directories, catalogues and other listings focusing on the definition of their
                          contents, rather than enumerating items and their details
                        - NEVER include the page title in the summary
					`
				},
				contents: md`
					---
					url: ${url}
					title: ${title}
					---
					
					${content}
				`
			}))
		)

	});
}
