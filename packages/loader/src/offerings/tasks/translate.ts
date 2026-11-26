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

import { schema } from "@grafctory/blue";
import { optional, resource } from "@grafctory/blue/resource";
import { string, text } from "@grafctory/blue/string";
import type { State } from "@grafctory/blue/value";
import { isString, type Optional } from "@grafctory/core";
import { markdown, tidy } from "@grafctory/core/strings";
import { immutable } from "@grafctory/core/values";
import { pipe, type Task } from "@grafctory/flow";
import { items } from "@grafctory/flow/feeds";
import { flat, map } from "@grafctory/flow/tasks";
import { service } from "@grafctory/gear";
import { getResource } from "@grafctory/gear/space";
import { createGoogleAI, FinishReason, json } from "@grafctory/llms-google";
import { validate } from "@grafctory/mime-jsonld";
import { log, report } from "@grafctory/tape";
import type { Agency, Dictionary, Draft, Entry } from "../sinks/sync.js";


const logger = log(import.meta.url);

const models = [ // tried in order: a text the first model loops on is retried with the next
	"gemini-3.8-flash",
	"gemini-3.5-flash-lite"
];


export type Texts = State<typeof Reported>;

type Credential = Draft["educationalCredentialAwarded"];


function Reported() {
	return resource({

		name: "Translated Offering",
		description: "The English translation of the texts describing an educational offering"

	}, {

		name: optional(text, {
			name: "Name",
			description: "The name of the offering translated to English"
		}),

		description: optional(string, { // ;( multi-line: texts keep the Markdown structure of the source
			name: "Description",
			description: "The description of the offering translated to English"
		}),

		summary: optional(string, {
			name: "Summary",
			description: "The summary of the offering translated to English"
		}),

		contents: optional(string, {
			name: "Contents",
			description: "The goals, structure and contents of the offering translated to English"
		}),

		outcomes: optional(string, {
			name: "Outcomes",
			description: "The learning outcomes of the offering translated to English"
		}),

		requirements: optional(string, {
			name: "Requirements",
			description: "The completion or examination requirements of the offering translated to English"
		}),

		prerequisites: optional(string, {
			name: "Prerequisites",
			description: "The prerequisites of the offering translated to English"
		}),

		educationalCredential: optional(text, {
			name: "Educational Credential",
			description: "The name of the educational credential awarded translated to English"
		}),

		occupationalCredential: optional(text, {
			name: "Occupational Credential",
			description: "The name of the occupational credential awarded translated to English"
		}),

		provider: optional(text, {
			name: "Provider",
			description: "The name of the organisation providing the offering translated to English"
		})

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an offering translator.
 *
 * Completes the English texts of each draft (name, description, summary, contents, learning outcomes, requirements,
 * prerequisites, the names of the credentials awarded and the name of its provider) from the ones stated in the local
 * language of the university delivering it, where the draft states no English one; a draft already stating them in
 * English, or stating nothing in the local language to translate, passes through untouched, while a draft given any
 * translated text is flagged as generated, as is a provider given a translated name. An answer leaving out a text it
 * was given is retried with the next model, as one the model loops on. A draft no model translates whole is logged and
 * dropped rather than handed on untranslated, so that it records no digest downstream and is translated again on the
 * next run, its stored offering left as the last run stated it.
 *
 * @param pipeline The name of the pipe running the task, labelling its model calls so their cost is charged to it
 * @returns A task completing the English texts of a feed of draft entries
 */
export function translate(pipeline: string): Task<Entry, Entry> {

	const ai = service(createGoogleAI);

	return entries => pipe(
		(items(entries))
		(flat(map(async entry => {

			const { draft } = entry;
			const source = sourced(draft);

			return Object.values(source).every(value => value === undefined) ? [entry] : pipe(
				(items(await generate(draft.key, draft.university.locale, source)))
				(map(({ name, educationalCredential, occupationalCredential, provider, ...translated }) => ({
					...translated,
					name: line(name),
					educationalCredential: line(educationalCredential),
					occupationalCredential: line(occupationalCredential),
					provider: line(provider)
				})))
				(validate(Reported))
				(map(translated => immutable({ ...entry, draft: merged(draft, translated) })))
			);

		})))
	);


	async function generate(key: string, locale: string, source: Texts): Promise<readonly Texts[]> {
		try {

			return [await request(locale, source, models)];

		} catch ( error ) {

			logger.error`failed to translate <${key}>: ${report(error)}`;

			return [];

		}
	}

	async function request(
		locale: string, source: Texts, [model, ...fallbacks]: readonly string[]
	): Promise<Texts> {

		const response = await ai.models.generateContent({

			model,

			contents: markdown`
				- language: ${locale}
				- name: ${source.name ?? ""}
				- description: ${source.description ?? ""}
				- summary: ${source.summary ?? ""}
				- contents: ${source.contents ?? ""}
				- outcomes: ${source.outcomes ?? ""}
				- requirements: ${source.requirements ?? ""}
				- prerequisites: ${source.prerequisites ?? ""}
				- educationalCredential: ${source.educationalCredential ?? ""}
				- occupationalCredential: ${source.occupationalCredential ?? ""}
				- provider: ${source.provider ?? ""}
			`,

			config: {

				labels: { pipe: pipeline },

				seed: 0,
				temperature: 0,
				maxOutputTokens: 8192, // above any genuine translation, so a degenerate repetition loop fails in seconds

				systemInstruction: await getResource(".sys.md", import.meta.url),

				responseMimeType: "application/json",
				responseJsonSchema: schema(Reported)

			}

		});

		// an answer the model loops on or leaves incomplete is retried with the next model, as the fixed settings would
		// make a plain retry repeat it

		const translated = response.candidates?.[0]?.finishReason === FinishReason.MAX_TOKENS
			? undefined
			: json<Texts>(response);

		const gaps = translated === undefined ? [] : missing(source, translated);

		if ( translated !== undefined && gaps.length === 0 ) {

			return translated;

		} else if ( fallbacks.length > 0 ) {

			return request(locale, source, fallbacks);

		} else {

			throw new Error(translated === undefined ? "truncated answer" : `untranslated texts <${gaps.join(", ")}>`);

		}

	}

}


/**
 * Lists the texts of a draft left to translate.
 *
 * @param draft The draft to translate
 *
 * @returns The texts the draft states in the local language of its university alone, leaving out the ones it already
 *     states in English
 */
export function sourced(draft: Draft): Texts {

	const { locale } = draft.university;

	const local = (text: Optional<Dictionary>) => text === undefined || text.en !== undefined
		? undefined
		: text[locale];

	return {

		name: local(draft.name),
		description: local(draft.description),
		summary: local(draft.disambiguatingDescription),
		contents: local(draft.teaches),
		outcomes: local(draft.assesses),
		requirements: local(draft.competencyRequired),
		prerequisites: local(draft.kind === "program" ? draft.programPrerequisites : draft.coursePrerequisites),
		educationalCredential: local(named(draft.educationalCredentialAwarded)),
		occupationalCredential: local(named(draft.occupationalCredentialAwarded)),
		provider: local(draft.provider?.name)

	};

}

/**
 * Lists the texts a translation leaves out.
 *
 * @param source The texts given for translation
 * @param translated The texts the model translated
 *
 * @returns The names of the texts given in `source` and left out of `translated` or translated blank
 */
export function missing(source: Texts, translated: Texts): readonly string[] {

	const answered = new Map(Object.entries(translated));

	return Object.entries(source)
		.filter(([key, text]) => text !== undefined && !answered.get(key)?.trim())
		.map(([key]) => key);

}

/**
 * Completes a draft with the English texts a model translated.
 *
 * @param draft The draft to complete
 * @param translated The English texts translated from the ones the draft states in its local language
 *
 * @returns The draft stating each translated text in English beside its original, flagged as generated where any text
 *     was translated, with its provider flagged as generated where its name was translated
 */
export function merged(draft: Draft, translated: Texts): Draft {

	const common = {

		// texts translated by the model mark the offering as generated

		...(Object.values(translated).some(text => text !== undefined) ? { generated: true } : {}),

		name: english(draft.name, translated.name) ?? draft.name,
		description: english(draft.description, translated.description),
		disambiguatingDescription: english(draft.disambiguatingDescription, translated.summary),
		teaches: english(draft.teaches, translated.contents),
		assesses: english(draft.assesses, translated.outcomes),
		competencyRequired: english(draft.competencyRequired, translated.requirements),
		educationalCredentialAwarded: credential(draft.educationalCredentialAwarded, translated.educationalCredential),
		occupationalCredentialAwarded: credential(draft.occupationalCredentialAwarded, translated.occupationalCredential),
		provider: provider(draft.provider, translated.provider)

	};

	return draft.kind === "program" ? immutable({

		...draft,
		...common,

		programPrerequisites: english(draft.programPrerequisites, translated.prerequisites)

	}) : immutable({

		...draft,
		...common,

		coursePrerequisites: english(draft.coursePrerequisites, translated.prerequisites)

	});

}


function line(text: Optional<string>): Optional<string> {
	return text && tidy(text) || undefined;
}

function named(credential: Credential): Optional<Dictionary> {
	return credential === undefined || credential.name === undefined || isString(credential.name)
		? undefined
		: credential.name;
}

function english(text: Optional<Dictionary>, translation: Optional<string>): Optional<Dictionary> {
	return text === undefined || translation === undefined ? text : { ...text, en: translation };
}

function credential(credential: Credential, translation: Optional<string>): Credential {
	return credential === undefined ? undefined : immutable({
		...credential,
		name: english(named(credential), translation) ?? credential.name
	});
}

// a provider named by a translation is flagged, so it keeps the identity its source name gives it

function provider(agency: Optional<Agency>, translation: Optional<string>): Optional<Agency> {
	return agency === undefined || translation === undefined ? agency : immutable({
		...agency,
		name: { ...agency.name, en: translation },
		generated: true
	});
}
