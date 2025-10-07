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
import { GenerateContentResponse, GoogleGenAI, GoogleGenAIOptions } from "@google/genai";

let sdk: null | Promise<GoogleGenAI>=null;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ai(opts: GoogleGenAIOptions={}): Promise<GoogleGenAI> {
	return sdk??=secret("googleai-key")
		.then(key => new GoogleGenAI({ apiKey: key, ...opts }));
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Extracts and validates text content from a Gemini API response.
 *
 * Manually extracts text parts to avoid SDK console warnings when non-text parts (like thinking, function calls, etc.)
 * are present in the response.
 *
 * @param response Response from a generateContent call
 * @returns Trimmed text content
 * @throws Error if the response contains no text content
 */
export function text(response: GenerateContentResponse): string {
	return (response.candidates?.[0]?.content?.parts ?? [])
		.filter(part => part.text && !part.thought)
		.map(part => part.text)
		.join("\n\n")
		.trim();
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
