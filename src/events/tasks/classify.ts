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

import { file } from "@/_/gear/files.js";
import { createGoogleAI, json } from "@/_/muse-google/index.js";
import { getTopicEntries } from "@/taxonomies/index.js";
import { events } from "@/taxonomies/pipes/events.core.js";
import { browseTopics } from "@/taxonomies/tools/browseTopics.js";
import { searchTopics } from "@/taxonomies/tools/searchTopics.js";
import { Type } from "@google/genai";
import { isString, type Object } from "@metreeca/core";
import { markdown } from "@metreeca/core/strings";
import type { Task } from "@metreeca/flow";
import { map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import type { Reference } from "@metreeca/qest/resource";
import { log } from "@metreeca/tape";



const tools = [
	searchTopics(events),
	browseTopics(events)
];


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a task classifying extracted event properties.
 *
 * Each payload is answered with the topics the event is tagged with, stated under `keywords`, so that a conversion
 * states a classification without matching anything of its own. Subject, format and audience are drawn from the same
 * taxonomy and stated together, so that a consumer tells the three apart by the branch a topic stands in rather than
 * by the property carrying it. The classification is left to the model, which reads the vocabulary itself and states
 * no topic where the event supports none, rather than being handed the closest one whatever its distance.
 *
 * Topics the taxonomy doesn't hold are dropped, as identifiers are stated by the model rather than copied from the
 * vocabulary by construction.
 *
 * @returns A task answering a feed of extracted property payloads with the same payloads, classified
 *
 * @throws {@link !Error Error} If no execution is running, as the Gemini client is resolved from the enclosing one
 */
export function classify(): Task<Object, Object> {

	const ai = service(createGoogleAI);

	return map(async payload => {

		if ( payload.event !== true ) { // a payload stating no event is dropped downstream, so it is not classified

			return payload;

		} else {

			const { keywords } = json<{

				keywords?: readonly string[]

			}>(await ai.models.generateContent({

				model: "gemini-3.6-flash",

				contents: markdown`
					title: ${payload.title as undefined | string ?? ""}
					description: ${payload.description as undefined | string ?? ""}
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
					responseSchema: {

						type: Type.OBJECT,

						properties: {

							keywords: {
								type: Type.ARRAY,
								items: { type: Type.STRING },
								description: `Identifiers of the topics from <${events.id}> the event is tagged with`
							}

						},

						required: ["keywords"]

					}

				}

			}));

			return {

				...payload,

				keywords: await stated(keywords)

			};

		}

	});


	async function stated(ids: readonly string[] = []): Promise<readonly Reference[]> {

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
