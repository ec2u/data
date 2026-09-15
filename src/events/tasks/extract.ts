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

import { getDate } from "@/_/core/temporal.js";
import { route } from "@/_/flow/route.js";
import { digest } from "@/_/gear-store/_digest.js";
import { validate } from "@/_/gear-store/validate.js";
import { file } from "@/_/gear/files.js";
import { createGoogleAI, json, schema } from "@/_/muse-google/index.js";
import { isStaleEvent } from "@/events/index.js";
import { boolean } from "@metreeca/blue/boolean";
import { optional, required, resource } from "@metreeca/blue/resource";
import { date, string, tag, time, url } from "@metreeca/blue/string";
import type { Instance } from "@metreeca/blue/value";
import { markdown, type Text } from "@metreeca/core/strings";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";


export type Payload = Instance<typeof X> & { // !!! remove

	readonly publishable: boolean

}



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Extracted() {
	return resource({

		event: required(boolean),

		url: required(url),
		title: required(string),
		summary: optional(string),
		description: required(string),

		startDate: required(date),
		startTime: optional(time),
		endDate: optional(date),
		endTime: optional(time),

		entryFees: optional(string),

		attendanceMode: optional(string),
		attendanceURL: optional(url),

		venueName: optional(string),
		venueAddress: optional(string),
		venueCity: optional(string),

		imageURL: optional(url),
		imageCredits: optional(string),

		language: required(tag)

	});
}


function X() {
	return resource(Extracted, {

		digest: required(string)

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function extract(): Task<Text, Payload> {

	const ai = service(createGoogleAI);

	return documents => pipe(
		(items(documents))
		(map(async document => ({

			digest: digest(document),

			...json<Instance<typeof Extracted>>(await ai.models.generateContent({

				model: "gemini-3.5-flash-lite",

				contents: [
					markdown`
						- date: ${getDate()}
					`,
					document
				],

				config: {

					seed: 0,
					temperature: 0,
					maxOutputTokens: 16384,

					systemInstruction: await file(".sys.md", import.meta.url),

					responseMimeType: "application/json",
					responseSchema: schema(Extracted)

				}

			}))

		})))
		(route(extracted => extracted.event, validate(X)))
		(map(extracted => ({

			publishable: extracted.event && !isStaleEvent(extracted),

			...extracted

		})))
	);

}
