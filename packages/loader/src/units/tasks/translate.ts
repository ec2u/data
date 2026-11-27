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

import type { Partner } from "@ec2u/data-shared/index.core.js";
import { schema } from "@grafctory/blue";
import { optional, resource } from "@grafctory/blue/resource";
import { string, text } from "@grafctory/blue/string";
import type { State } from "@grafctory/blue/value";
import { markdown, tidy } from "@grafctory/core/strings";
import { immutable } from "@grafctory/core/values";
import { pipe, type Task } from "@grafctory/flow";
import { items } from "@grafctory/flow/feeds";
import { flat, map } from "@grafctory/flow/tasks";
import { service } from "@grafctory/gear";
import { getResource } from "@grafctory/gear/space";
import { createGoogleAI, json, ThinkingLevel } from "@grafctory/llms-google";
import { validate } from "@grafctory/mime-jsonld";
import { log, report } from "@grafctory/tape";
import type { Entry } from "../sinks/sync.js";


const Reserve = 1024; // output tokens left for reasoning and the JSON frame
const Density = 3 / 4; // output tokens per source character, as link-heavy markdown runs to ~1.6 characters a token


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Reported() {
	return resource({

		name: "Translated Unit",
		description: "The English translation of the name and description of a unit"

	}, {

		name: optional(text, {
			name: "Name",
			description: "The name of the unit translated to English; stated only where a source name was given"
		}),

		description: optional(string, {
			name: "Description",
			description: "English translation of the source description of the unit, where one was given"
		})

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a unit translator.
 *
 * Completes the English name and description of each draft from the ones stated in the local language of
 * `university`, where the draft states no English one; a draft already stating both in English, or stating nothing
 * in the local language to translate, passes through untouched. A draft the model fails on is logged and dropped
 * rather than handed on untranslated, so that it is translated again on the next run.
 *
 * @param university The university the drafts are listed by, supplying the language their local texts are written in
 *
 * @param pipeline The name of the pipe running the task, labelling its model calls so their cost is charged to it
 * @returns A task completing the English texts of a feed of draft entries
 */
export function translate(university: Partner, pipeline: string): Task<Entry, Entry> {

	const ai = service(createGoogleAI);

	const { locale } = university;

	return entries => pipe(
		(items(entries))
		(flat(map(complete)))
	);


	async function complete(entry: Entry) {

		const { draft: { id, prefLabel, definition } } = entry;

		const source = {
			name: prefLabel.en === undefined ? prefLabel[locale] : undefined,
			description: definition?.en === undefined ? definition?.[locale] : undefined
		};

		return source.name === undefined && source.description === undefined ? [entry] : pipe(
			(items(await generate(id, source)))
			(map(({ name, ...translated }) => ({ ...translated, name: name && tidy(name) || undefined })))
			(validate(Reported))
			(map(translated => merge(entry, translated)))
		);

	}

	function merge(entry: Entry, { name, description }: State<typeof Reported>) {

		const { draft: { prefLabel, definition } } = entry;

		return immutable({

			...entry,

			draft: {

				...entry.draft,

				prefLabel: { ...prefLabel, ...(name === undefined ? {} : { en: name }) },

				definition: definition === undefined ? undefined : {
					...definition, ...(description === undefined ? {} : { en: description })
				}

			}

		});

	}


	async function generate(id: string, { name, description }: {

		readonly name?: string
		readonly description?: string

	}): Promise<readonly State<typeof Reported>[]> {
		try {

			return [json<State<typeof Reported>>(await ai.models.generateContent({

				model: "gemini-3.8-flash",

				contents: markdown`
					- language: ${locale}
					- name: ${name ?? ""}
					- description: ${description ?? ""}
				`,

				config: {

					labels: { pipe: pipeline },

					seed: 0,
					temperature: 0,
					maxOutputTokens: Reserve + Math.ceil(Density * ((name?.length ?? 0) + (description?.length ?? 0))),
					thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }, // the lowest the model accepts

					systemInstruction: await getResource(".sys.md", import.meta.url),

					responseMimeType: "application/json",
					responseJsonSchema: schema(Reported)

				}

			}))];

		} catch ( error ) {

			logger.error`failed to translate <${id}>: ${report(error)}`;

			return [];

		}
	}

}
