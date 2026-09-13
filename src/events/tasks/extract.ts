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
import { digest } from "@/_/gear-store/_digest.js";
import { file } from "@/_/gear/files.js";
import { createGoogleAI, json } from "@/_/muse-google/index.js";
import { Type } from "@google/genai";
import type { Object } from "@metreeca/core";
import { markdown, type Text } from "@metreeca/core/strings";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";


/**
 * Creates a task extracting event properties from event pages.
 *
 * Payloads are produced in the order pages are drawn. A page describing no single event, such as a listing or an error
 * page, is answered with a payload stating `event` false, so a caller MUST drop those rather than read them.
 *
 * Every payload states under `digest` the state of the page it was drawn from, so that what is stored from it may be
 * recorded together with the evidence for reading the page again only once the source has changed it.
 *
 * @returns A task converting a feed of markdown event pages into a feed of the property payloads they state
 *
 * @throws {@link !Error Error} If no execution is running
 *
 * @throws {@link !Error Error} While the feed is consumed, if no properties can be extracted from a page
 */
export function extract(): Task<Text, Object> {

	const ai = service(createGoogleAI);

	return documents => pipe(
		items(documents)
		(map(async document => ({

			...json<Object>(await ai.models.generateContent({

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
				responseSchema: {

					type: Type.OBJECT,

					properties: {

						event: {
							type: Type.BOOLEAN
						},

						url: {
							type: Type.STRING,
							format: "uri"
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

						language: {
							type: Type.STRING,
							pattern: "^[a-z]{2}$"
						}

					},

					required: [
						"event",
						"url",
						"title",
						"description",
						"startDate",
						"language"
					]

				}

			}

		})),

			digest: digest(document) // stated last, so that the page's own state is never overridden by the payload

		})))
	);

}
