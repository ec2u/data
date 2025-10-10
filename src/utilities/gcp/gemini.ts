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
import { md } from "@/utilities/core/tags";
import { secret } from "@/utilities/gcp/secrets";
import { EmbedContentResponse, GenerateContentResponse, GoogleGenAI, SchemaUnion } from "@google/genai";

let sdk: null | Promise<GoogleGenAI>=null;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ai(): Promise<GoogleGenAI> {
	return sdk??=secret("googleai-key").then(apiKey => new GoogleGenAI({ apiKey }));
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Extracts and validates text content from a Gemini API response.
 *
 * Manually extracts text parts to avoid SDK console warnings when non-text parts (like thinking, function calls, etc.)
 * are present in the response.
 *
 * @param response Response from a generateContent call
 *
 * @returns Trimmed text content
 *
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
 *
 * @returns Parsed JSON object
 *
 * @throws Error if the response contains no text or invalid JSON
 */
export function json<T>(response: GenerateContentResponse): T {
	try {

		return JSON.parse(text(response));

	} catch ( e ) {
		throw new Error(`malformed model response: ${message(e)}`);
	}
}

/**
 * Extracts embedding vector from a Gemini API response.
 *
 * @param response Response from an embedContent call
 *
 * @returns Embedding vector as an array of numbers, or empty array if not present
 */
export function embedding(response: EmbedContentResponse) {
	return response.embeddings?.[0]?.values ?? [];
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Converts unstructured text into structured data using the Gemini API.
 *
 * Instructs the model to extract and structure information from text according to the provided schema,
 * with deterministic output (seed=0, temperature=0) and automatic omission of undefined/empty values.
 *
 * @typeParam T Type of the structured data to return
 *
 * @param text Textual report to convert
 * @param schema JSON schema defining the expected output structure
 *
 * @returns Structured data conforming to the schema
 *
 * @throws Error if the model response is malformed or invalid JSON
 */
export function data<T>(text: string, schema: SchemaUnion): Promise<T> {
	return ai().then(async ai => json(await ai.models.generateContent({
		model: "gemini-2.5-flash-lite",
		contents: text,
		config: {
			seed: 0,
			temperature: 0,
			systemInstruction: md`
				ROLE / You are a data engineer.
				INPUT / You will be provided with a textual report.
				GOAL / Your task is to convert it into a structured machine-readable representation.
				OUTPUT / Reply with a structured JSON object; unless otherwise required by the provided schema:

				- ALWAYS omit undefined scalar values
				- ALWAYS omit empty object values
				- ALWAYS omit empty array values

			`,
			responseMimeType: "application/json",
			responseSchema: schema
		}
	})));
}
