/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { createGoogleAI, json } from "@/_/muse-google/index.js";
import { file } from "@/_/gear/files.js";
import { retrieve } from "@/pages/index.js";
import { pages } from "@/pages/store.js";
import { fetchPage } from "@/pages/tools/fetchPage.js";
import { Unit } from "@/units/index.js";
import { Type } from "@google/genai";
import { markdown } from "@metreeca/core/strings";
import { service } from "@metreeca/gear";


const tools = [
	fetchPage({ cache: pages.lookup(retrieve) })
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function expand(lead: Partial<Unit>): Promise<readonly Partial<Unit>[]> {
	return validate(lead, json<readonly Partial<Unit>[]>(await service(createGoogleAI).models.generateContent({
		model: "gemini-2.5-flash",
		contents: markdown`
			profile: ${lead.profile ?? "Not provided"}
			website: ${lead.website ?? "Not provided"}
			formal: ${lead.formal ?? "Not provided"}
			short: ${lead.short ?? "Not provided"}
			acronym: ${lead.acronym ?? "Not provided"}
			summary: ${lead.summary ?? "Not provided"}
		`,
		config: {
			seed: 0,
			temperature: 0,
			systemInstruction: await file(".sys.md", import.meta.url),
			tools,
			automaticFunctionCalling: {
				maximumRemoteCalls: 100
			},
			responseMimeType: "application/json",
			responseSchema: {
				type: Type.ARRAY,
				items: {
					type: Type.OBJECT,
					properties: {
						profile: {
							type: Type.STRING,
							description: "The URL of the institutional profile of the unit (omit if not available)"
						},
						website: {
							type: Type.STRING,
							description: "The URL of the unit's self-managed website (omit if not available)"
						},
						formal: {
							type: Type.STRING,
							description: "The formal name of the research unit"
						},
						short: {
							type: Type.STRING,
							description: "The short name of the research unit (omit if not available)"
						},
						acronym: {
							type: Type.STRING,
							description: "The acronym of the research unit (omit if not available)"
						},
						summary: {
							type: Type.STRING,
							description: "A brief summary of the research unit"
						}
					},
					required: ["formal", "summary"]
				}
			}
		}
	})));
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function validate(lead: Partial<Unit>, units: readonly Partial<Unit>[]) {
	return units.filter(item => {

		const leadProfileDomain = domain(lead.profile);
		const leadWebsiteDomain = domain(lead.website);

		// 1. Lead must have at least one domain

		if ( !leadProfileDomain && !leadWebsiteDomain ) {
			return false;
		}

		// 2. If lead has both, they must match

		if ( leadProfileDomain && leadWebsiteDomain && leadProfileDomain !== leadWebsiteDomain ) {
			return false;
		}

		// 3. Identify the shared lead domain

		const sharedDomain = leadProfileDomain ?? leadWebsiteDomain;

		// 4. Item's URLs (if defined) must match the shared domain

		const itemProfileDomain = domain(item.profile);
		const itemWebsiteDomain = domain(item.website);

		if ( itemProfileDomain && itemProfileDomain !== sharedDomain ) { return false; }
		if ( itemWebsiteDomain && itemWebsiteDomain !== sharedDomain ) { return false; }

		// At least one item URL must be present

		return !!(itemProfileDomain || itemWebsiteDomain);

	});
}

/**
 * Extract the domain from a URL (e.g., "unipv.it" from "https://dept.unipv.it/path")
 */
function domain(url: string | undefined): string | undefined {
	if ( url ) {

		try {

			const hostname = new URL(url).hostname;
			const parts = hostname.split(".");

			return parts.length >= 2 ? parts.slice(-2).join(".") : hostname;

		} catch {

			return undefined;

		}

	} else {

		return undefined;

	}
}
