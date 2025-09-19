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

import { error } from "@/core";
import { secret } from "@/gcp/secrets";
import { GoogleGenAI, Type } from "@google/genai";
import dedent from "dedent";

interface TranslationResult {
	originalText: string;
	translatedText: string;
	language: string;
}


function parse<T>(response: undefined | string): T {

	if ( !response ) {
		throw error("empty model response");
	}

	try {

		return JSON.parse(response);

	} catch ( e ) {
		return error(`malformed model response (${e}) <${response}>`);
	}
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function translateText(text: string): Promise<TranslationResult> {

	const ai=new GoogleGenAI({
		apiKey: await secret("googleai-key")
	});

	const response=await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents: text,
		config: {
			systemInstruction: dedent`
				- You are a professional translator.
				- You are expected to translate the text provided by the user.
				- Provide accurate translations and detect the source language.
				- Always respond with JSON containing the original text, translation, and detected language code.
			`,
			responseMimeType: "application/json",
			responseSchema: {
				type: Type.OBJECT,
				properties: {
					originalText: {
						type: Type.STRING,
						description: "The original text to translate"
					},
					translatedText: {
						type: Type.STRING,
						description: "The English translation"
					},
					language: {
						type: Type.STRING,
						description: "ISO 639-1 source language code"
					}
				},
				required: ["originalText", "translatedText", "language"]
			}
		}
	});

	return parse(response.text?.trim());
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

translateText("ciao babbo!")
	.then(console.info)
	.catch(console.error);
