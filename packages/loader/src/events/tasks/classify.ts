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

import { when } from "@metreeca/work/flow/when.js";
import { validate } from "@metreeca/work/mime-jsonld/validate.js";
import { file } from "@metreeca/work/gear/files.js";
import { createGoogleAI, json, schema } from "@metreeca/work/muse-google/index.js";
import { Extracted } from "./extract.js";
import { getTopicEntries } from "../../taxonomies/index.core.js";
import { events } from "@ec2u/data-shared/taxonomies/events.js";
import { browseTopics } from "../../taxonomies/tools/browseTopics.js";
import { searchTopics } from "../../taxonomies/tools/searchTopics.js";
import { multiple, resource } from "@metreeca/blue/resource";
import { iri } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { isString } from "@metreeca/core";
import { markdown } from "@metreeca/core/strings";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import type { Reference } from "@metreeca/qest/state";
import { log } from "@metreeca/tape";


const tools = [
	searchTopics(events),
	browseTopics(events)
];

const logger = log(import.meta.url);


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

export function Reported() {
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

	// an extracted payload stating no event is dropped downstream, so it is passed through unclassified

	return extracteds => pipe(
		(items(extracteds))
		(when(extracted => extracted.event, flat(map(async extracted => pipe(
				(items([

					json<State<typeof Reported>>(await ai.models.generateContent({

						model: "gemini-3.6-flash",

						contents: markdown`
						title: ${extracted.title ?? ""}
						description: ${extracted.description ?? ""}
					`,

						config: {

							seed: 0,
							temperature: 0,

							systemInstruction: await file(".sys.md", import.meta.url),

							tools,

							automaticFunctionCalling: {
								maximumRemoteCalls: 50
							},

							responseMimeType: "application/json",
							responseSchema: schema(Reported)

						}

					}))

				]))
				(validate(Reported))
				(map(async ({ keywords }) => ({

					keywords: await known(keywords),

					...extracted

				})))
			)))
		))
	);


	async function known(ids: readonly Reference[] = []): Promise<readonly Reference[]> { // !!! review

		const topics = await Promise.all(ids.map(async id => {

			if ( (await getTopicEntries(events, [id])).length > 0 ) {

				return id;

			} else {

				logger.warning`unknown topic <${id}> for taxonomy <${events.id}>`;

				return undefined;

			}

		}));

		return topics.filter(isString);

	}

}
