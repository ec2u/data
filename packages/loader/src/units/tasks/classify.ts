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
import { schema } from "@metreeca/blue";
import { multiple, resource } from "@metreeca/blue/resource";
import { iri } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { markdown } from "@metreeca/core/strings";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { getResource } from "@metreeca/gear/space";
import { createGoogleAI, json } from "@metreeca/llms-google";
import { validate } from "@metreeca/mime-jsonld";
import type { Reference } from "@metreeca/qest/state";
import { log, report } from "@metreeca/tape";
import { getTopicEntries } from "../../taxonomies/index.core.js";
import { browseTopics } from "../../taxonomies/tools/browseTopics.js";
import { searchTopics } from "../../taxonomies/tools/searchTopics.js";
import type { Entry } from "../sinks/sync.js";


const logger = log(import.meta.url);

const subjects = 3; // the largest number of research subjects a unit is tagged with

const tools = [
	searchTopics(organizations, euroscivoc),
	browseTopics(organizations, euroscivoc)
];


/**
 * A draft entry along with the topics it is tagged with.
 */
export type Classified = Entry & {

	readonly classification: readonly Reference[]
	readonly subject: readonly Reference[]

}


function Reported() {
	return resource({

		name: "Unit Topics",
		description: "The topics of the organisation and EuroSciVoc vocabularies a single unit is tagged with"

	}, {

		classification: multiple(iri, {
			name: "Types",
			description: `
				The identifiers of the topics from <${organizations.id}> naming the kind of unit, empty where none
				applies; only identifiers read from a tool response, copied exactly.
			`
		}),

		subject: multiple(iri, {
			name: "Subjects",
			description: `
				The identifiers of at most ${subjects} topics from <${euroscivoc.id}> naming the fields the unit does
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
 * states in its own words. Only topics the taxonomies hold are stated, each chain cut to its most specific member. A
 * draft the model fails on is logged and dropped rather than handed on untagged, and records no digest downstream, so
 * that it is classified again on the next run, while the unit the store holds for it stays as it was.
 *
 * @returns A task tagging a feed of draft entries with their topics
 */
export function classify(): Task<Entry, Classified> {

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


	async function tag({ draft: { id, prefLabel, definition, cues } }: Entry): Promise<readonly State<typeof Reported>[]> {
		try {

			return [json<State<typeof Reported>>(await ai.models.generateContent({

				model: "gemini-3.6-flash",

				contents: markdown`
					- name: ${prefLabel.en ?? Object.values(prefLabel)[0] ?? ""}
					- description: ${definition?.en ?? Object.values(definition ?? {})[0] ?? ""}
					- stated type: ${cues?.type ?? ""}
					- stated topics: ${cues?.topics ?? ""}
				`,

				config: {

					seed: 0,
					temperature: 0,

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

		const topics = new Set((await getTopicEntries(taxonomy, ids)).map(({ id }) => id));

		const stated = ids.filter(id => {

			if ( topics.has(id) ) {

				return true;

			} else {

				logger.warning`unknown topic <${id}> for taxonomy <${taxonomy.id}>`;

				return false;

			}

		});

		// a topic standing above another stated topic adds nothing a filter on the narrower one wouldn't find, so each
		// chain is cut to its most specific member; topic identifiers are slash-separated paths along the hierarchy of
		// their taxonomy, so standing above another topic is no more than a prefix test on the two identifiers

		return stated.filter(id => !stated.some(other => other.startsWith(`${id}/`)));

	}

}
