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

import { events } from "@ec2u/data-shared/taxonomies/events.js";
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
import { Extracted } from "./extract.js";


const logger = log(import.meta.url);

const tools = [
	searchTopics(events),
	browseTopics(events)
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Classified() {
	return resource(Extracted, {

		name: "Classified Event",
		description: "An extracted event with the vocabulary topics the model tagged it with"

	}, {

		keywords: multiple(iri, {
			name: "Topics",
			description: "The topics of the event vocabulary the event is tagged with"
		})

	});
}

function Reported() {
	return resource({

		name: "Event Topics",
		description: "The topics of the event vocabulary a single event is tagged with"

	}, {

		keywords: multiple(iri, {
			name: "Topics",
			description: `
				The identifiers of the topics from <${events.id}> the event is tagged with, drawn from any combination
				of the subject, format and audience branches, empty where none applies; only identifiers read from a
				tool response, copied exactly.
			`
		})

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function classify(): Task<State<typeof Extracted>, State<typeof Classified>> {

	const ai = service(createGoogleAI);

	// a payload not fit for publication carries nothing to classify and passes through untagged; a publishable one
	// the model fails on is dropped rather than published untagged, so its page is read again on the next run

	return extracteds => pipe(
		(items(extracteds))
		(flat(map(async extracted => extracted.publishable
			? pipe(
				(items(await tag(extracted)))
				(validate(Reported))
				(map(async ({ keywords }) => ({

					keywords: await known(keywords),

					...extracted

				})))
			)
			: items([{

				keywords: [],

				...extracted

			}])
		)))
	);


	async function tag({ url, title, description }: State<typeof Extracted>): Promise<readonly State<typeof Reported>[]> {
		try {

			return [await generate()];

		} catch ( error ) {

			logger.error`failed to classify <${url}>: ${report(error)}`;

			return [];

		}


		async function generate(): Promise<State<typeof Reported>> {
			return json<State<typeof Reported>>(await ai.models.generateContent({

			model: "gemini-3.6-flash",

			contents: markdown`
				title: ${title ?? ""}
				description: ${description ?? ""}
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

			}));
		}

	}

	async function known(ids: readonly Reference[] = []): Promise<readonly Reference[]> {

		const topics = new Set((await getTopicEntries(events, ids)).map(({ id }) => id));
		const tops = new Set((await getTopicEntries(events)).map(({ id }) => id));

		const stated = ids.filter(id => {

			if ( topics.has(id) ) {

				return true;

			} else {

				logger.warning`unknown topic <${id}> for taxonomy <${events.id}>`;

				return false;

			}

		});

		// a top concept says nothing about an event on its own, and a topic standing above another stated topic adds
		// nothing a filter on the narrower one wouldn't find, so each chain is cut to its most specific member; topic
		// identifiers are slash-separated paths along the hierarchy, so standing above is a prefix test

		return stated.filter(id => !tops.has(id) && !stated.some(other => other.startsWith(`${id}/`)));

	}

}
