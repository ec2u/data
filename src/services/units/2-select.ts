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
import { ai, text } from "@/utilities/gcp/gemini";
import dedent from "dedent";

/**
 * Identifies pages from a website sitemap that likely contain information about a research unit
 * as a whole, filtering out individual profiles and focusing on institutional content.
 *
 * @param pages - Array of page objects containing URL, title, and summary information
 *
 * @returns Promise resolving to array of selected page URLs that match the institutional criteria
 */
export function select(pages: readonly Page[]) {
	return ai().then(async ai => text(await ai.models.generateContent({

			model: "gemini-2.5-flash-lite",

			config: {
				...defaults,
				systemInstruction: md`
					ROLE / You are an academic content manager specializing in research activities.

					INPUT / You will be provided with an annotated sitemap for a website describing
					an academic research unit. Each entry includes:

					- the page URL
					- the page title
					- a page summary focusing on its role within the website

					GOAL / Your task is to identify pages where the following information about the
					unit AS A WHOLE is likely to be found:

					- general description of the research unit
					- research topics and fields of the unit
					- research publications from the unit
					- instrumentation and other facilities, including specialised software
					- entry points to sub-laboratories, research lines, or specialized facilities
					  within the unit
					- contact information

					You want information about the RESEARCH UNIT, NOT about individual researchers or
					their personal work: pages describing staff profiles and individual research
					topics and activities ARE STRICTLY FORBIDDEN.

					DO SELECT pages that describe specific laboratories, research groups, research
					lines, or facilities as institutional entities, even if they are sub-units of
					the main research unit.

					OUTPUT / Reply with a plaintext list containing a candidate page URL on each line.

					ABSOLUTE EXCLUSIONS / NEVER SELECT pages that:

					- Have URLs or titles indicating individual staff members (personnel identifiers,
					  role designators, or personal names)
					- Have URLs or titles indicating historical or archived content (temporal
					  qualifiers or archive designators)
					- Describe individual staff member profiles, biographies, or personal research
					  activities
					- Describe archival content, galleries, past activities, historical information,
					  or old website versions
					- Focus on student activities, courses, teaching, or educational content
					- Are directories of external links or resources
					- Contain news, events, announcements, or historical information

					POSITIVE INDICATORS / PRIORITIZE pages that:

					- Describe the lab's overall research areas or fields
					- List institutional publications or research outputs
					- Detail laboratory facilities, equipment, or software
					- Provide general information about the research unit
					- Describe specific named laboratories, research groups research lines or other
					  children units as institutional entities
					- Contain institutional-level content rather than individual-focused content:
					  you want pages about the RESEARCH UNIT, not about the PEOPLE in it.
				`
			},

			contents: pages

				.map(({ url, title, summary }) => dedent`
					url: ${url}
					title: ${title}
					summary: ${summary}
				`)

				.join("\n\n")

		})))

		.then(links => {

			const urls=new Set(pages.map(page => page.url));

			return links
				.split("\n")
				.filter(link => link !== "")
				.filter(link => urls.has(link));
		});
}
