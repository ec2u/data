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
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { string, text } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { opt } from "@metreeca/core";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { getResource } from "@metreeca/gear/space";
import { createGoogleAI, json } from "@metreeca/llms-google";
import { validate } from "@metreeca/mime-jsonld";
import { focus, html, untag } from "@metreeca/mime-xml";
import { fetch } from "@metreeca/pipe-url";
import { log, report } from "@metreeca/tape";
import { denoise } from "@metreeca/work/mime-xml/denoise.js";
import { execute } from "../../index.core.js";
import { type Dictionary, type ProgramDraft, sync } from "../sinks/sync.js";


const Source = resolve(base, "/offerings/pavia-schools");

const IndexURLs = [
	"https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-medici",
	"https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-non-medici"
];


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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(PaviaSchools);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the medical specialisation schools listed by Pavia University.
 *
 * Reads by model every school the two listing pages describe, for medical and for non-medical graduates, and states
 * them as programs. A listing page that fails to load, or that the model fails to read, fails the run before anything
 * is stated, so the schools it lists are never retracted on the strength of a failed request.
 *
 * @returns A promise resolving to a tally of what the run did
 *
 * @throws {@link !Error Error} If a listing page fails to load or to be read
 */
export async function PaviaSchools() {

	const ai = service(createGoogleAI);

	const listings = await Promise.all(IndexURLs.map(async url => pipe(
		(items([url]))
		(fetch())
		(html())
		(denoise())
		(focus())
		(untag())
		(flat(map(async document => pipe(
			(items(await list(url, document)))
			(validate(Reported))
		))))
		(toArray())
	)));

	const failed = listings.filter(listing => listing.length === 0).length;

	if ( failed > 0 ) {

		throw new Error(`failed listing pages <${failed}>`);

	} else {

		return pipe(
			(items(listings.flat().flatMap(({ schools = [] }) => schools)))
			(map(school))
			(flat(map(draft => draft === undefined ? [] : [draft])))
			(sync(Source))
		);

	}


	async function list(url: string, document: string): Promise<readonly State<typeof Reported>[]> {
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

			logger.error`failed to list schools at <${url}>: ${report(error)}`;

			return [];

		}
	}

}


/**
 * Drafts a specialisation school a listing page describes.
 *
 * The school is keyed and named in Italian as `Scuola di Specializzazione in` its listed name, stated at ISCED 2011
 * level 8 and awarding the `Diploma di Specializzazione` degree; its summary, contents, learning outcomes, admission
 * and completion requirements are stated in Italian, the language of the listing pages, leaving out blank ones.
 *
 * @param listed The school as the listing page describes it
 *
 * @returns The draft of the school, or `undefined` if its name is blank
 */
export function school({ name, summary, contents, outcomes, prerequisites, requirements }: Listed): undefined | ProgramDraft {

	const local = (value: undefined | string): undefined | Dictionary => opt(value?.trim(), value =>
		value === "" ? undefined : { [pavia.locale]: value }
	);

	const title = name.trim();
	const key = `Scuola di Specializzazione in ${title}`;

	return title === "" ? undefined : immutable({

		kind: "program",

		university: pavia,
		key,

		name: { [pavia.locale]: key },

		...opt(local(summary), disambiguatingDescription => ({ disambiguatingDescription })),
		...opt(local(contents), teaches => ({ teaches })),
		...opt(local(outcomes), assesses => ({ assesses })),
		...opt(local(prerequisites), programPrerequisites => ({ programPrerequisites })),
		...opt(local(requirements), competencyRequired => ({ competencyRequired })),

		educationalLevel: [getTopicId(isced2011, "8")],
		educationalCredentialAwarded: { credentialCategory: "Degree", name: { [pavia.locale]: "Diploma di Specializzazione" } }

	});

}
