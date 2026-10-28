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
import { email, string } from "@metreeca/blue/string";
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
import { fetchPage } from "../tools/fetchPage.js";


const logger = log(import.meta.url);


/**
 * An entry along with the profile of its unit, as the model drew it from the unit pages.
 */
export type Analysed = Entry & {

	readonly analysis: State<typeof Analysis>

}


function Analysis() {
	return resource({

		name: "Unit Analysis",
		description: "The profile of a research unit, in English, as its pages describe it"

	}, {

		formal: required(string, {
			name: "Formal Name",
			description: `
				The formal name of the research unit, including an explicit unit type descriptor: 'Laboratory of…',
				'Department of…', 'Research Group on…'.
			`
		}),

		short: optional(string, {
			name: "Short Name",
			description: `
				The short name of the research unit, stated only where the website defines one distinct from the formal
				name and the acronym.
			`
		}),

		acronym: optional(string, {
			name: "Acronym",
			description: "The acronym of the research unit, stated only where the website defines one"
		}),

		identifier: optional(string, {
			name: "Identifier",
			description: "The internal identifier of the research unit, stated only where the website states one"
		}),

		email: optional(email, {
			name: "Email Address",
			description: "The institutional email address of the research unit, stated only where the website states one"
		}),

		summary: required(string, {
			name: "Summary",
			description: "A plain text summary of the research unit, of about 500 characters"
		}),

		description: required(string, {
			name: "Description",
			description: "A general description of the research unit, in markdown format"
		}),

		keywords: multiple(string, {
			name: "Keywords",
			description: "Keywords describing the research areas and fields of the research unit"
		})

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a unit analyser.
 *
 * Profiles the unit of each entry, exploring its website, or the directory page listing it where it has none, along
 * with the pages they link to. An entry the model fails on is logged and dropped rather than handed on unprofiled, and
 * records no digest downstream, so that it is analysed again on the next run whatever its page holds.
 *
 * @returns A task completing a feed of entries with the profiles of their units
 */
export function analyze(): Task<Entry, Analysed> {

	const ai = service(createGoogleAI);

	return entries => pipe(
		(items(entries))
		(flat(map(async entry => pipe(
			(items(await generate(entry)))
			(validate(Analysis))
			(map((analysis): Analysed => immutable({ ...entry, analysis })))
		))))
	);


	async function generate({ id, listed: { profile, website, formal } }: Entry): Promise<readonly unknown[]> {
		try {

			return [json(await ai.models.generateContent({

				model: "gemini-2.5-flash",

				contents: markdown`
					profile: ${profile}
					website: ${website ?? "Not provided"}
					name: ${formal}
				`,

				config: {

					seed: 0,
					temperature: 0,

					systemInstruction: await getResource(".sys.md", import.meta.url),

					tools: [fetchPage()],

					automaticFunctionCalling: {
						maximumRemoteCalls: 100
					},

					responseMimeType: "application/json",
					responseJsonSchema: schema(Analysis)

				}

			}))];

		} catch ( error ) {

			logger.error`failed to analyze <${id}>: ${report(error)}`;

			return [];

		}
	}

}
