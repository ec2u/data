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

import { getTopicId } from "@ec2u/data-shared/taxonomies/index.js";
import { isced2011 } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { pavia } from "@ec2u/data-shared/universities/index.core.js";
import { schema } from "@metreeca/blue";
import { multiple, required, resource } from "@metreeca/blue/resource";
import { string, text } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import type { Optional } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { getResource } from "@metreeca/gear/space";
import { createGoogleAI, json } from "@metreeca/llms-google";
import { validate } from "@metreeca/mime-jsonld";
import { log, report } from "@metreeca/tape";
import { isHTTP } from "@metreeca/work/core/resources.js";
import type { Lead } from "../sinks/crawl.js";


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

/**
 * Seeds a doctorate the school index lists.
 *
 * The doctorate is keyed by its page address and named `Dottorato in` or `Doctorate in` its listed name, depending on
 * the language the name is written in, falling back to Italian for an unknown language; it is stated at ISCED 2011
 * level 8, awarding the Italian research doctorate degree, facts the page extraction never overrides.
 *
 * @param listed The doctorate as the index lists it
 *
 * @returns The lead of the doctorate, or `undefined` if its address is unusable or its name blank
 */
export function lead({ name, language, url }: Listed): Optional<Lead> {

	const address = url.trim();
	const title = name.trim();
	const locale = language === "en" ? "en" : pavia.locale;

	return isHTTP(address) && title !== "" ? immutable({

		url: address,

		seed: immutable({

			kind: "program",

			university: pavia,
			key: address,

			name: { [locale]: `${locale === "en" ? "Doctorate in" : "Dottorato in"} ${title}` },
			url: [address],

			educationalLevel: [getTopicId(isced2011, "8")],
			educationalCredentialAwarded: { credentialCategory: "Degree", name: { [pavia.locale]: "Dottorato di Ricerca" } }

		})

	}) : undefined;

}
