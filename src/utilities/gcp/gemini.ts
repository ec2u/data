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
import { GenerateContentResponse, GoogleGenAI } from "@google/genai";

let sdk: null | Promise<GoogleGenAI>=null;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ai(): Promise<GoogleGenAI> {
	return sdk??=secret("googleai-key").then(key => new GoogleGenAI({
		apiKey: key
	}));
}


export function text(response: GenerateContentResponse): string {

	const text=response.text?.trim();

	if ( !text ) {
		throw new Error("empty model response");
	}

	return text;
}

export function json<T>(response: GenerateContentResponse): T {
	try {

		return JSON.parse(text(response));

	} catch ( e ) {
		throw new Error(`malformed model response: ${message(e)}`);
	}
}
