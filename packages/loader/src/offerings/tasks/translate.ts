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
import { createGoogleAI, FinishReason, type GenerateContentResponse, json } from "@grafctory/llms-google";
import { validate } from "@grafctory/mime-jsonld";
import { log, report } from "@grafctory/tape";
import type { Dictionary, Draft, Entry } from "../sinks/sync.js";


const logger = log(import.meta.url);

const models = [ // tried in order: a text the first model loops on is retried with the next
	"gemini-3.8-flash",
	"gemini-3.5-flash-lite"
];


type Texts = State<typeof Reported>;

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
		})

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an offering translator.
 *
 * Completes the English texts of each draft (name, description, summary, contents, learning outcomes, requirements,
 * prerequisites and the names of the credentials awarded) from the ones stated in the local language of the university
 * delivering it, where the draft states no English one; a draft already stating them in English, or stating nothing in
 * the local language to translate, passes through untouched, while a draft given any translated text is flagged as
 * generated. A draft the model fails on is logged and dropped rather than handed on untranslated, so that it records
 * no digest downstream and is translated again on the next run, its stored offering left as the last run stated it.
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
			const { locale } = draft.university;

			const local = (text: Optional<Dictionary>) => text === undefined || text.en !== undefined
				? undefined
				: text[locale];

			const source: Texts = {

				name: local(draft.name),
				description: local(draft.description),
				summary: local(draft.disambiguatingDescription),
				contents: local(draft.teaches),
				outcomes: local(draft.assesses),
				requirements: local(draft.competencyRequired),
				prerequisites: local(draft.kind === "program" ? draft.programPrerequisites : draft.coursePrerequisites),
				educationalCredential: local(named(draft.educationalCredentialAwarded)),
				occupationalCredential: local(named(draft.occupationalCredentialAwarded))

			};

			return Object.values(source).every(value => value === undefined) ? [entry] : pipe(
				(items(await generate(draft.key, locale, source)))
				(map(({ name, educationalCredential, occupationalCredential, ...translated }) => ({
					...translated,
					name: name && tidy(name) || undefined,
					educationalCredential: educationalCredential && tidy(educationalCredential) || undefined,
					occupationalCredential: occupationalCredential && tidy(occupationalCredential) || undefined
				})))
				(validate(Reported))
				(map(translated => immutable({ ...entry, draft: merge(draft, translated) })))
			);

		})))
	);


	function named(credential: Credential): Optional<Dictionary> {
		return credential === undefined || credential.name === undefined || isString(credential.name)
			? undefined
			: credential.name;
	}

	function merge(draft: Draft, translated: Texts): Draft {

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
			occupationalCredentialAwarded: credential(draft.occupationalCredentialAwarded, translated.occupationalCredential)

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

	function english(text: Optional<Dictionary>, translation: Optional<string>): Optional<Dictionary> {
		return text === undefined || translation === undefined ? text : { ...text, en: translation };
	}

	function credential(credential: Credential, translation: Optional<string>): Credential {
		return credential === undefined ? undefined : immutable({
			...credential,
			name: english(named(credential), translation) ?? credential.name
		});
	}


	async function generate(key: string, locale: string, source: Texts): Promise<readonly Texts[]> {
		try {

			return [json<Texts>(await request(locale, source, models))];

		} catch ( error ) {

			logger.error`failed to translate <${key}>: ${report(error)}`;

			return [];

		}
	}

	async function request(
		locale: string, source: Texts, [model, ...fallbacks]: readonly string[]
	): Promise<GenerateContentResponse> {

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
				- educational credential: ${source.educationalCredential ?? ""}
				- occupational credential: ${source.occupationalCredential ?? ""}
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

		return response.candidates?.[0]?.finishReason === FinishReason.MAX_TOKENS && fallbacks.length > 0
			? request(locale, source, fallbacks)
			: response;

	}

}
