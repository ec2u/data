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

import { euroscivoc } from "@ec2u/data-shared/taxonomies/euroscivoc.js";
import type { Taxonomy } from "@ec2u/data-shared/taxonomies/index.js";
import { organizations } from "@ec2u/data-shared/taxonomies/organizations.js";
import { schema } from "@grafctory/blue";
import { multiple, resource } from "@grafctory/blue/resource";
import { iri } from "@grafctory/blue/string";
import type { State } from "@grafctory/blue/value";
import { markdown } from "@grafctory/core/strings";
import { pipe, type Task } from "@grafctory/flow";
import { items } from "@grafctory/flow/feeds";
import { flat, map } from "@grafctory/flow/tasks";
import { service } from "@grafctory/gear";
import { getResource } from "@grafctory/gear/space";
import { createGoogleAI, json } from "@grafctory/llms-google";
import { validate } from "@grafctory/mime-jsonld";
import type { Reference } from "@grafctory/qest/state";
import { log, report } from "@grafctory/tape";
import { getConceptEntries } from "../../taxonomies/index.core.js";
import { browseConcepts } from "../../taxonomies/tools/browseConcepts.js";
import { searchConcepts } from "../../taxonomies/tools/searchConcepts.js";
import type { Entry } from "../sinks/sync.js";


const logger = log(import.meta.url);

const subjects = 3; // the largest number of research subjects a unit is tagged with

const tools = [
	searchConcepts(organizations, euroscivoc),
	browseConcepts(organizations, euroscivoc)
];


/**
 * A draft entry along with the concepts it is tagged with.
 */
export type Classified = Entry & {

	readonly classification: readonly Reference[]
	readonly subject: readonly Reference[]

}


function Reported() {
	return resource({

		name: "Unit Concepts",
		description: "The concepts of the organisation and EuroSciVoc vocabularies a single unit is tagged with"

	}, {

		classification: multiple(iri, {
			name: "Types",
			description: `
				The identifiers of the concepts from <${organizations.id}> naming the kind of unit, empty where none
				applies; only identifiers read from a tool response, copied exactly.
			`
		}),

		subject: multiple(iri, {
			name: "Subjects",
			description: `
				The identifiers of at most ${subjects} concepts from <${euroscivoc.id}> naming the fields the unit does
				research in, most relevant first, empty where none applies; only identifiers read from a tool response,
				copied exactly.
			`
		})

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a unit classifier.
 *
 * Tags each draft with the kind of unit it is, from the EC2U organisation taxonomy, and with up to three fields it does
 * research in, from EuroSciVoc, reading its English name and description along with the type and topics the source
 * states in its own words. Only concepts the taxonomies hold are stated, each chain cut to its most specific member. A
 * draft the model fails on is logged and dropped rather than handed on untagged, and records no digest downstream, so
 * that it is classified again on the next run, while the unit the store holds for it stays as it was.
 *
 * @param pipeline The name of the pipe running the task, labelling its model calls so their cost is charged to it
 * @returns A task tagging a feed of draft entries with their concepts
 */
export function classify(pipeline: string): Task<Entry, Classified> {

	const ai = service(createGoogleAI);

	return entries => pipe(
		(items(entries))
		(flat(map(async entry => pipe(
			(items(await tag(entry)))
			(validate(Reported))
			(map(async ({ classification, subject }) => ({

				...entry,

				classification: await known(organizations, classification),
				subject: (await known(euroscivoc, subject)).slice(0, subjects)

			})))
		))))
	);


	async function tag({
		draft: {
			id,
			prefLabel,
			definition,
			cues
		}
	}: Entry): Promise<readonly State<typeof Reported>[]> {
		try {

			return [json<State<typeof Reported>>(await ai.models.generateContent({

				model: "gemini-3.8-flash",

				contents: markdown`
					- name: ${prefLabel.en ?? Object.values(prefLabel)[0] ?? ""}
					- description: ${definition?.en ?? Object.values(definition ?? {})[0] ?? ""}
					- stated type: ${cues?.type ?? ""}
					- stated topics: ${cues?.topics ?? ""}
				`,

				config: {

					labels: { pipe: pipeline },

					seed: 0,
					temperature: 0,
					maxOutputTokens: 8192,

					systemInstruction: await getResource(".sys.md", import.meta.url),

					tools,

					automaticFunctionCalling: {
						maximumRemoteCalls: 50
					},

					responseMimeType: "application/json",
					responseJsonSchema: schema(Reported)

				}

			}))];

		} catch ( error ) {

			logger.error`failed to classify <${id}>: ${report(error)}`;

			return [];

		}
	}

	async function known(taxonomy: Taxonomy, ids: readonly Reference[] = []): Promise<readonly Reference[]> {

		const concepts = new Set((await getConceptEntries(taxonomy, ids)).map(({ id }) => id));

		const stated = ids.filter(id => {

			if ( concepts.has(id) ) {

				return true;

			} else {

				logger.warning`unknown concept <${id}> for taxonomy <${taxonomy.id}>`;

				return false;

			}

		});

		// a concept standing above another stated concept adds nothing a filter on the narrower one wouldn't find, so
		// each chain is cut to its most specific member; concept identifiers are slash-separated paths along the
		// hierarchy of their taxonomy, so standing above another concept is no more than a prefix test on the two
		// identifiers

		return stated.filter(id => !stated.some(other => other.startsWith(`${id}/`)));

	}

}
