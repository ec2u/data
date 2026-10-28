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
import { optional, required, resource } from "@metreeca/blue/resource";
import { string, text } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { immutable } from "@metreeca/core/values";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { getResource } from "@metreeca/gear/space";
import { createGoogleAI, json } from "@metreeca/llms-google";
import { validate } from "@metreeca/mime-jsonld";
import { log, report } from "@metreeca/tape";
import { fingerprint } from "@metreeca/work/core/digest.js";
import type { Page } from "../sinks/crawl.js";
import type { Entry } from "../sinks/sync.js";


const logger = log(import.meta.url);

const LanguagePattern = /^[a-z]{2}$/;


function Reported() {
	return resource({

		name: "Extracted Unit",
		description: "An academic unit as the page describing it states it, in the language of the page"

	}, {

		name: required(text, {
			name: "Name",
			description: "The official name of the unit"
		}),

		acronym: optional(text, {
			name: "Acronym",
			description: "The acronym of the unit, verbatim as the page defines it, stated only where it leaves no doubt"
		}),

		description: required(string, {
			name: "Description",
			description: `
				The full description of the unit as the page includes it, in markdown format, carrying over neither the
				H1 heading stating its name nor any account of ongoing or upcoming events.
			`
		}),

		language: required(string, {
			name: "Language",
			description: "The ISO 639-1 tag of the language the page is written in, in lowercase"
		})

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a unit extractor.
 *
 * Drafts the unit each page describes, keyed by the page address and linking it as the homepage, with the official
 * name, the acronym where the page defines one, and the description, all in the language the page is written in,
 * falling back to the local language of `university` where the page language can't be told. The draft is recorded with
 * the fingerprint of the page content, so it is extracted again only once the visible text of the page changes. A
 * page the model fails on is logged and dropped rather than drafted incomplete, so it is extracted again next run.
 *
 * @param university The university the pages are listed by, supplying the fallback language of their content
 *
 * @returns A task converting a feed of unit pages into a feed of draft entries
 */
export function extract(university: University): Task<Page, Entry> {

	const ai = service(createGoogleAI);

	return pages => pipe(
		(items(pages))
		(flat(map(async ({ url, document }) => pipe(
			(items(await generate(url, document)))
			(validate(Reported))
			(map(({ name, acronym, description, language }): Entry => {

				const tag = LanguagePattern.test(language) ? language : university.locale;

				return immutable({

					hash: fingerprint(document),

					draft: {

						id: url,

						prefLabel: { [tag]: name },
						altLabel: acronym,
						definition: { [tag]: description },

						homepage: [url],
						mbox: [],

						unitOf: [],
						institutes: [],

						heads: []

					}

				});

			}))
		))))
	);


	async function generate(id: string, document: string): Promise<readonly State<typeof Reported>[]> {
		try {

			return [json<State<typeof Reported>>(await ai.models.generateContent({

				model: "gemini-3.6-flash",

				contents: document,

				config: {

					seed: 0,
					temperature: 0,

					systemInstruction: await getResource(".sys.md", import.meta.url),

					responseMimeType: "application/json",
					responseJsonSchema: schema(Reported)

				}

			}))];

		} catch ( error ) {

			logger.error`failed to extract <${id}>: ${report(error)}`;

			return [];

		}
	}

}
