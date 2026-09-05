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

import { createOpenAI, json } from "@/_/muse-openai/index.js";
import type { Value } from "@metreeca/core";
import { markdown, type Text } from "@metreeca/core/strings";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";


/**
 * Creates a task extracting event properties from event pages.
 *
 * Each markdown page is read into the JSON payload of properties it states, in the order pages are drawn, under the
 * prompt and the response schema the legacy Java pipeline submits, ported verbatim; turning a payload into an event
 * record is left to whoever draws it.
 *
 * The {@link createOpenAI OpenAI client} is resolved as the task is created, so the enclosing execution must already
 * be running by then; the steering prompt travels with this module, so a deployment needs nothing beside the compiled
 * code.
 *
 * @returns A task converting a feed of markdown event pages into a feed of the property payloads they state
 *
 * @throws {@link !Error Error} If no execution is running, as the OpenAI client is resolved from the enclosing one
 *
 * @throws {@link !Error Error} While the feed is consumed, whatever the source reports while producing pages,
 * whatever the API reports on a request it cannot recover from, or if the model replies with no output text or with
 * malformed JSON
 */
export function extractOpenAI(): Task<Text, Value> {

	const ai = service(createOpenAI);

	return documents => pipe(
		items(documents)
		(map(async document => ({

			// !!! stub: the scanner takes the event URL from the page id, which the ported prompt doesn't ask for

			url: "https://example.org/",

			...json<{ readonly [property: string]: Value }>(await ai.chat.completions.create({

			model: "gpt-4o-mini",

			seed: 0,
			temperature: 0,
			max_completion_tokens: 4096,

			response_format: {

				type: "json_schema",

				json_schema: {

					name: "event",

					schema: {

						type: "object",

						properties: {

							title: {
								type: "string"
							},

							summary: {
								type: "string"
							},

							description: {
								type: "string"
							},

							startDate: {
								type: "string",
								format: "date"
							},

							startTime: {
								type: "string",
								format: "time"
							},

							endDate: {
								type: "string",
								format: "date"
							},

							endTime: {
								type: "string",
								format: "time"
							},

							entryFees: {
								type: "string"
							},

							attendanceMode: {
								type: "string"
							},

							attendanceURL: {
								type: "string",
								format: "uri"
							},

							venueName: {
								type: "string"
							},

							venueAddress: {
								type: "string"
							},

							imageURL: {
								type: "string",
								format: "uri"
							},

							imageCredits: {
								type: "string"
							},

							topic: {
								type: "string"
							},

							audience: {
								type: "string"
							},

							language: {
								type: "string",
								pattern: "^[a-z]{2}$"
							}

						},

						required: [
							"title",
							"description",
							"startDate",
							"language"
						],

						additionalProperties: false

					}

				}

			},

			messages: [

				{
					role: "system",
					content: markdown`
						Extract the following properties from the provided markdown document describing an academic event:

						- title
						- plain text summary of less than 500 characters with strictly no markdown formatting
						- complete descriptive text as included in the document in markdown format; make absolutely
						  sure not to include  in the description H1 (#) headings with the document title
						- start date in ISO format, taking into account that the current date is ${date()}
						- start time in ISO format without seconds (hh:mm)
						- end date in ISO format, taking into account that the current date is ${date()}
						- end time in ISO format without seconds (hh:mm)
						- entry fees (free, paid); include only if absolutely confident; make sure not to mix up
						  registration required with paid entry fees
						- attendance mode (offline, online, mixed)
						- attendance URL (make absolutely sure to include it only if attendance is online or mixed)
						- venue name
						- venue street address
						- venue city name
						- image URL (may include a query component), only if reasonably sure
						- image credits or copyright
						- major topic
						- intended audience
						- language as guessed from the description as a 2-letter ISO tag

						Don't include properties that are not defined in the document.
						Don't include empty properties.

						Respond with a JSON object
					`
				},

				{
					role: "user",
					content: document
				}

			]

		}))

		})))
	);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function date(): string {
	return new Date().toISOString().slice(0, 10);
}
