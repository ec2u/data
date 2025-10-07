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

import { file } from "@/utilities/core/files";
import { log } from "@/utilities/core/log";
import { DatastoreCache } from "@/utilities/gcp/cache";
import { ai } from "@/utilities/gcp/gemini";
import { fetchPage } from "@/utilities/gcp/gemini-tools";

export async function explore(site: string): Promise<string> {

	const client=await ai();


	const tools={

		fetchPage: fetchPage({ cache: DatastoreCache({ kind: "Page" }) })

	};

	const contents: Array<{ role: string; parts: any }>=[
		{ role: "user", parts: [{ text: site }] }
	];

	const maxRounds=20;

	for (let round=0; round < maxRounds; round++) {

		const response=await client.models.generateContent({
			model: "gemini-2.5-flash",
			contents,
			config: {
				seed: 0,
				temperature: 0,
				systemInstruction: await file("./1-explore.md", import.meta.url),
				tools: [{
					functionDeclarations: Object.values(tools).map(tool => tool.declaration)
				}]
			}
		});


		const parts=response.candidates?.[0]?.content?.parts;

		if ( parts ) {
			if ( response.functionCalls && response.functionCalls.length > 0 ) {

				contents.push(
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

				// NOTE: The Gemini API does not support combining function calling (tools) with structured
				// output (responseMimeType/responseSchema) in the same request. This returns unstructured
				// text that must be parsed manually or processed in a follow-up call with responseSchema.
				// See:
				// - https://discuss.ai.google.dev/t/function-calling-with-a-response-mime-type-application
				//   -json-is-unsupported/105093
				// - https://github.com/google-gemini/deprecated-generative-ai-python/issues/515
				// - https://github.com/agno-agi/agno/issues/3292

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
