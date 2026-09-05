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

import { file } from "@/_/host-node/files.js";
import { createGoogleAI, json } from "@/_/muse-google/index.js";
import { Type } from "@google/genai";
import type { Value } from "@metreeca/core";
import { markdown, type Text } from "@metreeca/core/strings";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";


/**
 * Creates a task extracting event properties from event pages.
 *
 * Each markdown page is read into the JSON payload of properties it states, in the order pages are drawn; turning a
 * payload into an event record is left to whoever draws it.
 *
 * A payload states through its `event` property whether the page describes a single event: a page that describes none,
 * such as a listing or an error page, is answered with `event` false and placeholder properties, so a caller MUST drop
 * those payloads rather than read them.
 *
 * The {@link createGoogleAI Gemini client} is resolved as the task is created, so the enclosing execution must already
 * be running by then, and the steering prompt is read from the `.sys.md` file shipped alongside this module, so a
 * deployment must carry it next to the compiled code.
 *
 * @returns A task converting a feed of markdown event pages into a feed of the property payloads they state
 *
 * @throws {@link !Error Error} If no execution is running, as the Gemini client is resolved from the enclosing one
 *
 * @throws {@link !Error Error} While the feed is consumed, if the prompt cannot be read, whatever the source reports
 * while producing pages, whatever the API reports on a request it cannot recover from, or if the model replies with
 * no output text or with malformed JSON
 */
export function extractGoogle(): Task<Text, Value> {

	const ai = service(createGoogleAI);

	return documents => pipe(
		items(documents)
		(map(async document => ({

			// !!! stub: the scanner takes the event URL from the page id, which the ported prompt doesn't ask for

			url: "https://example.org/",

			...json<{ readonly [property: string]: Value }>(await ai.models.generateContent({

				model: "gemini-3.5-flash-lite",

				contents: [
					markdown`
						- date: ${new Date().toISOString().slice(0, 10)}
					`,
					document
				],

				config: {

					seed: 0,
					temperature: 0,
					maxOutputTokens: 8192,

					systemInstruction: await file(".sys.md", import.meta.url),

					responseMimeType: "application/json",
					responseSchema: {

						type: Type.OBJECT,

						properties: {

							event: {
								type: Type.BOOLEAN
							},

							title: {
								type: Type.STRING
							},

							summary: {
								type: Type.STRING
							},

							description: {
								type: Type.STRING
							},

							startDate: {
								type: Type.STRING,
								format: "date"
							},

							startTime: {
								type: Type.STRING,
								pattern: "^[0-9]{2}:[0-9]{2}$"
							},

							endDate: {
								type: Type.STRING,
								format: "date"
							},

							endTime: {
								type: Type.STRING,
								pattern: "^[0-9]{2}:[0-9]{2}$"
							},

							entryFees: {
								type: Type.STRING
							},

							attendanceMode: {
								type: Type.STRING
							},

							attendanceURL: {
								type: Type.STRING,
								format: "uri"
							},

							venueName: {
								type: Type.STRING
							},

							venueAddress: {
								type: Type.STRING
							},

							venueCity: {
								type: Type.STRING
							},

							imageURL: {
								type: Type.STRING,
								format: "uri"
							},

							imageCredits: {
								type: Type.STRING
							},

							topic: {
								type: Type.STRING
							},

							audience: {
								type: Type.STRING
							},

							language: {
								type: Type.STRING,
								pattern: "^[a-z]{2}$"
							}

						},

						required: [
							"event",
							"title",
							"description",
							"startDate",
							"language"
						]

					}

				}

			}))

		})))
	);

}
