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

import { schema } from "@metreeca/blue";
import { multiple, required, resource } from "@metreeca/blue/resource";
import { string, text } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { getResource } from "@metreeca/gear/space";
import { createGoogleAI, json } from "@metreeca/llms-google";
import { validate } from "@metreeca/mime-jsonld";
import { log, report } from "@metreeca/tape";


/**
 * A doctorate as the school index lists it.
 */
export type Listed = {

	readonly name: string
	readonly language: string
	readonly url: string

}


const logger = log(import.meta.url);


function Reported() {
	return resource({

		name: "Listed Doctorates",
		description: "The doctoral programs a doctoral school index lists"

	}, {

		programs: multiple(resource({

			name: "Listed Doctorate",
			description: "A doctoral program as the index lists it"

		}, {

			name: required(text, {
				name: "Name",
				description: "The name of the doctoral program as the index lists it"
			}),

			language: required(string, {
				name: "Language",
				description: "The ISO 639-1 tag of the language the name is written in, in lowercase"
			}),

			url: required(string, {
				name: "Address",
				description: "The web address of the page describing the doctoral program, as the index links it"
			})

		}))

	});
}


/**
 * Lists by model the doctorates a doctoral school index describes.
 *
 * An index the model fails to read is logged and lists nothing.
 *
 * @returns A task converting a feed of index documents, as plain text, into a feed of the doctorates they list
 */
export function doctorates(): Task<string, Listed> {

	const ai = service(createGoogleAI);

	return documents => pipe(
		(items(documents))
		(flat(map(async document => pipe(
			(items(await list(document)))
			(validate(Reported))
			(flat(map(({ programs = [] }) => programs)))
		))))
	);


	async function list(document: string): Promise<readonly State<typeof Reported>[]> {
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

			logger.error`failed to list doctorates: ${report(error)}`;

			return [];

		}
	}

}
