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

import type { University } from "@ec2u/data-shared/universities/index.core.js";
import { schema } from "@metreeca/blue";
import { optional, resource } from "@metreeca/blue/resource";
import { string, text } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { markdown } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { getResource } from "@metreeca/gear/space";
import { createGoogleAI, json } from "@metreeca/llms-google";
import { validate } from "@metreeca/mime-jsonld";
import { log, report } from "@metreeca/tape";
import type { Entry } from "../sinks/sync.js";


const logger = log(import.meta.url);


function Reported() {
	return resource({

		name: "Translated Document",
		description: "The English translation of the title and description of a document"

	}, {

		title: optional(text, {
			name: "Title",
			description: "The title of the document translated to English; stated only where a source title was given"
		}),

		description: optional(string, { // ;( multi-line: descriptions keep the line and paragraph breaks of the source
			name: "Description",
			description: "The description of the document translated to English; stated only where a source description was given"
		})

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a document translator.
 *
 * Completes the English title and description of each draft from the ones stated in the local language of
 * `university`, where the draft states no English one; a draft already stating both in English, or stating nothing
 * in the local language to translate, passes through untouched. A draft the model fails on is logged and dropped
 * rather than handed on untranslated, so that it is translated again on the next run.
 *
 * @param university The university the drafts are listed by, supplying the language their local texts are written in
 *
 * @returns A task completing the English texts of a feed of draft entries
 */
export function translate(university: University): Task<Entry, Entry> {

	const ai = service(createGoogleAI);

	const { locale } = university;

	return entries => pipe(
		(items(entries))
		(flat(map(async entry => {

			const { draft: { id, title, description } } = entry;

			const source = {
				title: title.en === undefined ? title[locale] : undefined,
				description: description?.en === undefined ? description?.[locale] : undefined
			};

			return source.title === undefined && source.description === undefined ? [entry] : pipe(
				(items(await generate(id, source)))
				(validate(Reported))
				(map(translated => immutable({

					...entry,

					draft: {

						...entry.draft,

						title: { ...title, ...(translated.title === undefined ? {} : { en: translated.title }) },

						description: description === undefined ? undefined : {
							...description, ...(translated.description === undefined ? {} : { en: translated.description })
						}

					}

				})))
			);

		})))
	);


	async function generate(id: string, { title, description }: {

		readonly title?: string
		readonly description?: string

	}): Promise<readonly State<typeof Reported>[]> {
		try {

			return [json<State<typeof Reported>>(await ai.models.generateContent({

				model: "gemini-3.6-flash",

				contents: markdown`
					- language: ${locale}
					- title: ${title ?? ""}
					- description: ${description ?? ""}
				`,

				config: {

					seed: 0,
					temperature: 0,

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
