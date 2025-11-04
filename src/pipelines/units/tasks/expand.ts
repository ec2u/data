/*
 * Copyright © 2020-2025 EC2U Alliance
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

import { pages } from "@/pipelines/pages/store";
import { fetchPage } from "@/pipelines/pages/tools/fetchPage";
import { Unit } from "@/pipelines/units";
import { units } from "@/pipelines/units/store";
import { guard, log, message, time } from "@/utilities/core/log";
import { md } from "@/utilities/core/tags";
import { ai, data } from "@/utilities/gcp/gemini";
import { withRetry } from "@/utilities/gcp/retry";
import { Units } from "@/utilities/hub";
import { file } from "@/utilities/node/files";
import { uuid } from "@/utilities/node/uuid";
import { Content, Part, Type } from "@google/genai";
import { pipe } from "@metreeca/pipe";
import { items } from "@metreeca/pipe/feeds";
import { forEach, toArray } from "@metreeca/pipe/sinks";
import { filter, flatMap, map, peek } from "@metreeca/pipe/tasks";


const tools = [
	fetchPage({ cache: pages.lookup })
];


if ( import.meta.main ) {
	expand();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function expand(): Promise<void>;
export async function expand(lead: Partial<Unit>): Promise<readonly Partial<Unit>[]>;

export async function expand(lead?: Partial<Unit>) {

	if ( lead ) {

		// Schema for structured data extraction
		const schema = {
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
		};

		// Initialize conversation history
		const conversationHistory: Content[] = [{
			role: "user",
			parts: [{
				text: md`
					profile: ${lead.profile ?? "Not provided"}
					website: ${lead.website ?? "Not provided"}
					formal: ${lead.formal ?? "Not provided"}
					short: ${lead.short ?? "Not provided"}
					acronym: ${lead.acronym ?? "Not provided"}
					summary: ${lead.summary ?? "Not provided"}
				`
			}]
		}];

		// Get tool declarations from CallableTool instances
		const toolDeclarations = await Promise.all(tools.map(t => t.tool()));

		// Load system instruction
		const systemInstruction = await file(".sys.md", import.meta.url);

		// Manual function calling loop with state preservation
		let turnCount = 0;
		const maxTurns = 100; // Same as previous maximumRemoteCalls

		while ( turnCount < maxTurns ) {
			turnCount++;

			// Call API with retry logic - conversationHistory preserved across retries
			const response = await withRetry(
				() => ai.models.generateContent({
					model: "gemini-2.5-flash",
					contents: conversationHistory,
					config: {
						seed: 0,
						temperature: 0,
						systemInstruction,
						tools: toolDeclarations
						// Note: NO automaticFunctionCalling - we control the loop manually
					}
				}),
				{ name: `expand(turn ${turnCount})` }
			);

			// Add model's response to conversation history
			const modelContent = response.candidates?.[0]?.content;
			if ( !modelContent ) {
				throw new Error("no model content in response");
			}

			conversationHistory.push(modelContent);

			// Check if model wants to call functions
			const functionCalls = modelContent.parts?.filter(part => part.functionCall);

			if ( functionCalls && functionCalls.length > 0 ) {
				// Execute function calls using CallableTool interface
				const allResults: Part[] = [];

				for (const tool of tools) {
					const results = await tool.callTool(
						functionCalls.map(fc => fc.functionCall!).filter(Boolean)
					);
					allResults.push(...results);
				}

				// Add function responses to history as user message
				conversationHistory.push({
					role: "user",
					parts: allResults
				});

				// Continue loop - model will process function results in next turn

			} else {
				// Model provided final text response - extract structured data
				return data(response, schema);
			}
		}

		throw new Error(`maximum turns (${maxTurns}) reached without completion`);

	} else {

		return time(() => pipe(
			// (items({ website: "https://fisica.dip.unipv.it/" } as Unit))
			(items({ website: "https://iii.dip.unipv.it/it" } as Unit))
				// (items(units.select({ expanded: Date.now()-stale })))
				(map(async lead => ({
					lead, items: await pipe(
						(items(lead))
						(flatMap(guard(expand)))
						(filter(item => {

							const leadProfileDomain = domain(lead.profile);
							const leadWebsiteDomain = domain(lead.website);

							// 1. Lead must have at least one domain

							if ( !leadProfileDomain && !leadWebsiteDomain ) { return false; }

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

						}))
						(map(item => ({

							...item,

							parent: lead.id,
							university: lead.university

						})))
						(toArray())
					)

				}), {
					parallel: true
				}))
				(peek(v => console.info(v)))
				(forEach(async ({ lead, items }) => {

					for (const item of items) {
						if ( !await units.lookup(item) ) { // check and update atomically
							await units.insert({ ...item, id: `${Units}${uuid()}` });
						}
					}

					await units.insert({ ...lead, expanded: Date.now() });

				}))
		), (count, elapsed) => log.info(expand.name, // !!! broken count
			`identified <${count}> units in <${message(elapsed)}> ms`
		));

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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

	} else { return undefined; }
}
