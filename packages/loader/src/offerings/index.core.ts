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

/**
 * Value readers shared by the offerings pipes.
 *
 * @module
 */

import { schema } from "@metreeca/blue";
import type { ResourceShape } from "@metreeca/blue/resource";
import { isString, type Lazy, opt, type Value } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { service } from "@metreeca/gear";
import { createGoogleAI, json } from "@metreeca/llms-google";
import type { Dictionary, Draft } from "./sinks/sync.js";


/**
 * Reads a non-blank string, trimmed.
 *
 * @param value The value to read
 *
 * @returns The trimmed string, or `undefined` if `value` is not a string or is blank
 */
export function text(value: unknown): undefined | string {
	return isString(value) && value.trim() !== "" ? value.trim() : undefined;
}

/**
 * Checks whether a string is an absolute web address.
 *
 * @param url The string to check
 *
 * @returns `true` if `url` parses as an absolute `http` or `https` address
 */
export function isWeb(url: string): boolean {
	return URL.canParse(url) && /^https?:$/.test(new URL(url).protocol);
}

/**
 * Reads an amount of hours as an ISO 8601 duration, rounded to the minute.
 *
 * @param amount The amount of hours
 *
 * @returns The duration, stating minutes only where the amount is not a whole number of hours
 */
export function hours(amount: number): string {

	const minutes = Math.round(amount*60);

	return `PT${Math.floor(minutes/60)}H${minutes%60 === 0 ? "" : `${minutes%60}M`}`;

}

/**
 * Maps language names to their tags.
 *
 * @param locale The language tag of the locale the names are written in
 *
 * @returns The ISO 639-1 tags of the languages the locale names, keyed by lowercase name
 */
export function languageTags(locale: string): ReadonlyMap<string, string> {

	const names = new Intl.DisplayNames([locale], { type: "language" });
	const letters = [..."abcdefghijklmnopqrstuvwxyz"];

	return new Map(letters
		.flatMap(first => letters.map(second => `${first}${second}`))
		.flatMap(tag => opt(names.of(tag), (name): readonly [string, string][] =>
			name === tag ? [] : [[name.toLowerCase(), tag]]
		) ?? [])
	);

}

/**
 * States a degree as the credential an offering awards.
 *
 * @param name The name of the degree
 *
 * @returns The credential awarding the degree
 */
export function degree(name: Dictionary): NonNullable<Draft["educationalCredentialAwarded"]> {
	return immutable({ credentialCategory: "Degree", name });
}

/**
 * Reads a document by model.
 *
 * @param shape The shape of the structured output the model is asked for
 * @param prompt The system instruction telling the model what to read from the document
 * @param document The document to read
 *
 * @returns A promise resolving to what the model reads from the document, as `shape` structures it
 *
 * @throws {@link !Error Error} If the model fails to answer or answers with no valid JSON
 */
export async function generate<T extends Value>(shape: Lazy<ResourceShape>, prompt: string, document: string): Promise<T> {
	return json<T>(await service(createGoogleAI).models.generateContent({

		model: "gemini-3.6-flash",

		contents: document,

		config: {

			seed: 0,
			temperature: 0,

			systemInstruction: prompt,

			responseMimeType: "application/json",
			responseJsonSchema: schema(shape)

		}

	}));
}
