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

import { documents } from "@ec2u/data-shared/taxonomies/documents.js";
import type { Taxonomy } from "@ec2u/data-shared/taxonomies/index.js";
import { stakeholders } from "@ec2u/data-shared/taxonomies/stakeholders.js";
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

const tools = [
	searchConcepts(documents, stakeholders),
	browseConcepts(documents, stakeholders)
];


/**
 * A draft entry along with the concepts it is tagged with.
 */
export type Classified = Entry & {

	readonly type: readonly Reference[]
	readonly audience: readonly Reference[]

}


function Reported() {
	return resource({

		name: "Document Concepts",
		description: "The concepts of the document and stakeholder vocabularies a single document is tagged with"

	}, {

		type: multiple(iri, {
			name: "Types",
			description: `
				The identifiers of the concepts from <${documents.id}> naming the kind of document, empty where none
				applies; only identifiers read from a tool response, copied exactly.
			`
		}),

		audience: multiple(iri, {
			name: "Audience",
			description: `
				The identifiers of the concepts from <${stakeholders.id}> naming who the document is addressed to, empty
				where none applies; only identifiers read from a tool response, copied exactly.
			`
		})

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a document classifier.
 *
 * Tags each draft with the kinds of document it is, from the EC2U document taxonomy, and with the stakeholders it is
 * addressed to, from the EC2U stakeholder taxonomy, reading its English title and description along with the type
 * and audience the source states in its own words. Only concepts the taxonomies hold are stated, each chain cut to its
 * most specific member. A draft the model fails on is logged and dropped rather than handed on untagged, so that it
 * is classified again on the next run.
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
			(map(async ({ type, audience }) => ({

				...entry,

				type: await known(documents, type),
				audience: await known(stakeholders, audience)

			})))
		))))
	);


	async function tag({ draft: { id, title, description, cues } }: Entry): Promise<readonly State<typeof Reported>[]> {
		try {

			return [json<State<typeof Reported>>(await ai.models.generateContent({

				model: "gemini-3.8-flash",

				contents: markdown`
					- title: ${title.en ?? Object.values(title)[0] ?? ""}
					- description: ${description?.en ?? Object.values(description ?? {})[0] ?? ""}
					- stated type: ${cues?.type ?? ""}
					- stated audience: ${cues?.audience ?? ""}
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
		// hierarchy, so standing above is a prefix test

		return stated.filter(id => !stated.some(other => other.startsWith(`${id}/`)));

	}

}
