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

import { message } from "@/utilities/core/log";
import { secret } from "@/utilities/gcp/secrets";
import { FunctionDeclaration, GenerateContentParameters, GenerateContentResponse, GoogleGenAI } from "@google/genai";

let sdk: null | Promise<GoogleGenAI>=null;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ai(): Promise<GoogleGenAI> {
	return sdk??=secret("googleai-key")
		.then(key => new GoogleGenAI({ apiKey: key }))
		.then(ai => {

			ai.models.generateContent=generateContent(ai.models.generateContent.bind(ai.models));

			return ai;

		});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Extracts and validates text content from a Gemini API response.
 *
 * @param response Response from a generateContent call
 * @returns Trimmed text content
 * @throws Error if the response contains no text content
 */
export function text(response: GenerateContentResponse): string {

	const value=response.text?.trim();

	if ( !value ) {
		throw new Error("empty model response");
	}

	return value;
}

/**
 * Extracts and parses JSON content from a Gemini API response.
 *
 * @param response Response from a generateContent call with JSON output
 * @returns Parsed JSON object
 * @throws Error if the response contains no text or invalid JSON
 */
export function json<T>(response: GenerateContentResponse): T {

	try {

		return JSON.parse(text(response));

	} catch ( e ) {
		throw new Error(`malformed model response: ${message(e)}`);
	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function generateContent(original: (params: GenerateContentParameters) => Promise<GenerateContentResponse>) {

	const maxRounds=20;


	return async (params: GenerateContentParameters): Promise<GenerateContentResponse> => {

		// Build map of function name to callable tool
		// Note: The declaration object itself is the callable function (via Object.assign)

		const tools: Record<string, FunctionDeclaration>=Object.fromEntries(
			params.config?.tools
				?.filter((tool): tool is {
					functionDeclarations: FunctionDeclaration[]
				} => "functionDeclarations" in tool)
				.flatMap(tool => tool.functionDeclarations)
				.filter(declaration => declaration.name)
				.map(declaration => [declaration.name, declaration])
			?? []
		);

		if ( Object.keys(tools).length ) {

			// Initialize conversation history from params.contents
			const contents: Array<{ role: string; parts: any }>=(Array.isArray(params.contents)
				? [...params.contents]
				: [{
					role: "user",
					parts: typeof params.contents === "string" ? [{ text: params.contents }] : params.contents
				}]) as any;

			for (let round=0; round < maxRounds; round++) {

				const response=await original({
					...params,
					contents
				});

				const parts=response.candidates?.[0]?.content?.parts;

				if ( parts ) {
					if ( response.functionCalls && response.functionCalls.length > 0 ) {

						contents.push(
							{ role: "model", parts },
							{
								role: "function", parts: await Promise.all(
									response.functionCalls.map(async (call) => {

										const tool=call.name ? tools[call.name] : undefined;

										if ( tool ) {
											return {
												functionResponse: {
													name: call.name!,
													response: await tool(call.args as any)
												}
											};
										} else {
											return {
												functionResponse: {
													name: call.name ?? "unknown",
													response: { error: `unknown function <${call.name}>` }
												}
											};
										}

									})
								)
							}
						);

					} else {
						return response;
					}
				}

			}

			throw new Error(`safety limit reached (${maxRounds} rounds of function calling)`);
		} else {
			return original(params);
		}
	};
}
