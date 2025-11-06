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
import { isString } from "@metreeca/core";

export const ai = new GoogleGenAI({
	apiKey: await secret("googleai-key")
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Extracts and validates text content from a Gemini API response.
 *
 * Filters out non-text parts (thinking, function calls, etc.) to extract only output text.
 * Validates response completeness when automatic function calling is used.
 *
 * @param response Response from a generateContent call
 *
 * @returns Trimmed text content from the final response
 *
 * @throws Error if response validation fails or contains no output text
 */
export function text(response: GenerateContentResponse): string {
	return (validate(response).candidates?.[0]?.content?.parts ?? [])
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
 * @throws Error if response validation fails, contains no output text, or has invalid JSON
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
 * Extracts URLs from the source and provides them as a reference list to ensure accurate preservation.
 * Uses deterministic output (seed=0, temperature=0) and automatic omission of undefined/empty values.
 * When source is a GenerateContentResponse, validates completeness before extraction.
 *
 * @remarks
 * This function uses a two-step approach because the Gemini API doesn't support combining
 * function calling/tools with structured output (responseSchema) in a single request.
 * See: https://github.com/googleapis/js-genai/issues/727
 *
 * When automaticFunctionCalling is enabled, the first call executes tools without responseSchema,
 * then this function makes a second call with responseSchema but without tools to format the result.
 *
 * @typeParam T Type of the structured data to return
 *
 * @param source Textual report or GenerateContentResponse to convert
 * @param schema JSON schema defining the expected output structure
 *
 * @returns Structured data conforming to the schema
 *
 * @throws Error if source validation fails, response is empty, or contains invalid JSON
 */
export async function data<T>(source: string | GenerateContentResponse, schema: SchemaUnion): Promise<T> {

	const input = isString(source) ? source : text(source);

	// reject empty or whitespace-only input to prevent hallucinations

	if ( !input || input.trim().length === 0 ) {
		throw new Error("empty model response: unable to extract structured data");
	}

	const urls = [...new Set(input.match(/https?:\/\/[^\s\[\]()<>]+/g) || [])];

	return json(await ai.models.generateContent({
		model: "gemini-2.5-flash-lite",
		contents: [input, urls.length > 0
			? md`REFERENCE URLs found in source (use EXACTLY as written):
					${urls.map(url => `- ${url}`).join("\n")}
			`
			: "REFERENCE URLs found in source: (none identified)"
		],
		config: {
			seed: 0,
			temperature: 0,
			systemInstruction: md`
				ROLE / You are a data engineer.
				INPUT / You will be provided with a textual report and a reference list of URLs extracted from it.
				GOAL / Your task is to convert it into a structured machine-readable representation.
				OUTPUT / Reply with a structured JSON object; unless otherwise required by the provided schema:

				- ALWAYS omit undefined scalar values
				- ALWAYS omit empty object values
				- ALWAYS omit empty array values
				- ALWAYS omit fields with value "Not defined" or similar placeholder text
				- ALWAYS omit fields with error messages or system artifacts

				CRITICAL: When including URLs in the output, copy them EXACTLY from the REFERENCE URLs list.
				- DO NOT modify domain names (e.g., 'ec2u' must remain 'ec2u', NOT 'ec22')
				- DO NOT modify path components
				- Use copy-paste accuracy from the reference list

			`,
			responseMimeType: "application/json",
			responseSchema: schema
		}
	}));
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Validates a Gemini API response for completeness and correctness.
 *
 * When automatic function calling is enabled, checks if the final response contains output text.
 * A complete response should have text in candidates[0].content.parts after function calling completes.
 * If the final response has no output text, this indicates the generation was interrupted or incomplete.
 *
 * @remarks
 * This validation is necessary because automaticFunctionCalling and responseSchema cannot
 * be used together (see https://github.com/googleapis/js-genai/issues/727). Responses with function
 * calling must be validated separately before passing to the data() function for structured extraction.
 *
 * @param response Response from a generateContent call
 *
 * @returns The same response (pass-through for chaining)
 *
 * @throws Error if validation fails (incomplete results, corrupted response, etc.)
 */
function validate(response: GenerateContentResponse): GenerateContentResponse {

	const history = response.automaticFunctionCallingHistory;

	if ( history && history.length > 0 ) {

		// Check if the final response (not history) contains output text

		const finalParts = response.candidates?.[0]?.content?.parts ?? [];
		const hasOutputText = finalParts.some(part => part.text && !part.thought);

		if ( !hasOutputText ) {

			const functionCallTurns = history.filter(msg =>
				msg.role === "model" && msg.parts?.some(part => part.functionCall)
			).length;

			throw new Error(
				`generation incomplete with no output text after ${functionCallTurns} function calling turn(s)`
			);
		}
	}

	return response;
}
