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

const tools = [
	searchTopics(documents, stakeholders),
	browseTopics(documents, stakeholders)
];


/**
 * A draft entry along with the topics it is tagged with.
 */
export type Classified = Entry & {

	readonly type: readonly Reference[]
	readonly audience: readonly Reference[]

}


function Reported() {
	return resource({

		name: "Document Topics",
		description: "The topics of the document and stakeholder vocabularies a single document is tagged with"

	}, {

		type: multiple(iri, {
			name: "Types",
			description: `
				The identifiers of the topics from <${documents.id}> naming the kind of document, empty where none
				applies; only identifiers read from a tool response, copied exactly.
			`
		}),

		audience: multiple(iri, {
			name: "Audience",
			description: `
				The identifiers of the topics from <${stakeholders.id}> naming who the document is addressed to, empty
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
 * and audience the source states in its own words. Only topics the taxonomies hold are stated, each chain cut to its
 * most specific member. A draft the model fails on is logged and dropped rather than handed on untagged, so that it
 * is classified again on the next run.
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

				model: "gemini-3.6-flash",

				contents: markdown`
					- title: ${title.en ?? Object.values(title)[0] ?? ""}
					- description: ${description?.en ?? Object.values(description ?? {})[0] ?? ""}
					- stated type: ${cues?.type ?? ""}
					- stated audience: ${cues?.audience ?? ""}
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
		// chain is cut to its most specific member; topic identifiers are slash-separated paths along the hierarchy, so
		// standing above is a prefix test

		return stated.filter(id => !stated.some(other => other.startsWith(`${id}/`)));

	}

}
