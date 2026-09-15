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
import type { Payload } from "@/events/tasks/extract.js";
import { getTopicEntries } from "@/taxonomies/index.js";
import { events } from "@/taxonomies/pipes/events.core.js";
import { browseTopics } from "@/taxonomies/tools/browseTopics.js";
import { searchTopics } from "@/taxonomies/tools/searchTopics.js";
import { Type } from "@google/genai";
import { isString } from "@metreeca/core";
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

export function classify(): Task<Payload> {

	const ai = service(createGoogleAI);

	return map(async payload => {

		if ( !payload.event ) { // a payload stating no event is dropped downstream, so it is not classified

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
