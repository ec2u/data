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

import { base } from "@ec2u/data-shared";
import { getTopicId } from "@ec2u/data-shared/taxonomies/index.js";
import { isced2011 } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { pavia } from "@ec2u/data-shared/universities/index.core.js";
import { schema } from "@metreeca/blue";
import { multiple, required, resource } from "@metreeca/blue/resource";
import { string, text } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map, trim } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { getResource } from "@metreeca/gear/space";
import { createGoogleAI, json } from "@metreeca/llms-google";
import { validate } from "@metreeca/mime-jsonld";
import { focus, html, untag } from "@metreeca/mime-xml";
import { fetch } from "@metreeca/pipe-url";
import { log, report } from "@metreeca/tape";
import { denoise } from "@metreeca/work/mime-xml/denoise.js";
import { execute } from "../../index.core.js";
import { crawl, type Lead } from "../sinks/crawl.js";


const Source = resolve(base, "/offerings/pavia-doctorates");

const IndexURL = "https://phd.unipv.it/la-scuola-di-alta-formazione-dottorale-di-pavia-safd/";


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
 * A doctorate as the school index lists it.
 */
export type Listed = {

	readonly name: string
	readonly language: string
	readonly url: string

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(PaviaDoctorates);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the doctoral programs listed by the Pavia doctoral school.
 *
 * Reads the doctorates the school index page lists by model, then crawls their pages, extracting each program by
 * model over what the index states. An index that fails to load, or that the model fails to read, yields no leads, so
 * the run retracts nothing on the strength of it and fails on the retraction floor instead.
 *
 * @returns A promise resolving to a tally of what the run did
 */
export async function PaviaDoctorates() {

	const ai = service(createGoogleAI);

	return pipe(
		(items([IndexURL]))
		(fetch())
		(html())
		(denoise())
		(focus())
		(untag())
		(flat(map(async document => pipe(
			(items(await list(document)))
			(validate(Reported))
			(flat(map(({ programs = [] }) => programs)))
			(map(lead))
			(trim())
		))))
		(crawl(Source))
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
export function lead({ name, language, url }: Listed): undefined | Lead {

	const address = url.trim();
	const title = name.trim();
	const locale = language === "en" ? "en" : pavia.locale;

	return URL.canParse(address) && /^https?:$/.test(new URL(address).protocol) && title !== "" ? immutable({

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
