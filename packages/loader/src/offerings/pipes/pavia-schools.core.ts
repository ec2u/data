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
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
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
 * A specialisation school as a listing page describes it.
 */
export type Listed = {

	readonly name: string

	readonly summary?: string
	readonly contents?: string
	readonly outcomes?: string
	readonly prerequisites?: string
	readonly requirements?: string

}


const logger = log(import.meta.url);


function Reported() {
	return resource({

		name: "Listed Schools",
		description: "The specialisation schools a listing page describes"

	}, {

		schools: multiple(resource({

			name: "Listed School",
			description: "A specialisation school as the listing page describes it"

		}, {

			name: required(text, {
				name: "Name",
				description: "The name of the school, without the `Scuola di Specializzazione in` prefix"
			}),

			summary: optional(string, {
				name: "Summary",
				description: "A plain text summary of the school of about 500 characters"
			}),

			contents: optional(string, {
				name: "Contents",
				description: "The goals, structure and contents of the school"
			}),

			outcomes: optional(string, {
				name: "Outcomes",
				description: "The acquired competencies or intended learning outcomes"
			}),

			prerequisites: optional(string, {
				name: "Prerequisites",
				description: "The admission requirements"
			}),

			requirements: optional(string, {
				name: "Requirements",
				description: "The graduation or completion requirements"
			})

		}))

	});
}


/**
 * Lists by model the specialisation schools listing pages describe.
 *
 * A page the model fails to read is logged and yields no school.
 *
 * @returns A task converting a feed of listing documents, as plain text, into a feed of the schools they list
 */
export function schools(): Task<string, Listed> {

	const ai = service(createGoogleAI);

	return documents => pipe(
		(items(documents))
		(flat(map(async document => pipe(
			(items(await list(document)))
			(validate(Reported))
			(flat(map(({ schools = [] }) => schools)))
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

			logger.error`failed to list schools: ${report(error)}`;

			return [];

		}
	}

}
