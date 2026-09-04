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

/**
 * Event extraction.
 *
 * Provides the {@link extract} task factory, so that a pipe turns the event pages it carries into structured
 * {@link Event} records as a step of its own, without assembling model requests.
 *
 * @module
 *
 * @see {@link https://ai.google.dev/gemini-api/docs Gemini API}
 */

import { createGoogleAI, json } from "@/_/muse-google/index.js";
import { file } from "@/_/node/files.js";
import type { Event } from "@/events/index.js";
import { Type } from "@google/genai";
import { markdown, type Text } from "@metreeca/core/strings";
import { pipe, type Task } from "@metreeca/flow";
import { filter, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";


/**
 * The first markdown image stated by a page, as the image illustrating the event it describes.
 */
const Image = /!\[[^\]]*]\(\s*([^)\s]+)/;


/**
 * Creates a task extracting events from event pages.
 *
 * Each markdown page is converted into the event properties it states and emitted in the order pages are drawn, so
 * that a feed of pages is read as a feed of events.
 *
 * Pages are handed to the {@link createGoogleAI Gemini client} bound to the enclosing execution, one request each, so
 * that credentials, endpoint and quota pacing are settled once by the consumer binding that client rather than by the
 * task: a feed extracting at speed is held back by that pacing rather than rejected by the API.
 *
 * Events are extracted at a fixed seed, so that the same page yields the same properties as consistently as the model
 * allows. The current date travels with each request, so a page stating a relative date is resolved against the day it
 * is drawn on rather than against the day the task was created on.
 *
 * The title, description and start date of an event are declared required to the API, and the remaining properties are
 * extracted as far as the page states them. Declaring that set is what makes extraction complete: left optional, the
 * omission rules the prompt states dominate and a page is stripped down to two or three properties it happens to state
 * most plainly. Prompting alone does not recover them, whatever the model.
 *
 * The illustrating image is read off the page rather than asked for, as the first image a page states is the one
 * illustrating it and no judgement is called for: a page carrying one always yields it, at no cost and with no chance
 * of an invented URL. A model naming an image of its own is taken at its word, so a page where the choice is less
 * obvious can still be answered by the model rather than by position.
 *
 * The language of an event is not among them, and is left to whoever knows it: a page reaching this task has usually
 * been rendered into a common language upstream, so a language read off it would name that rendering rather than the
 * event.
 *
 * Nothing invented is emitted. A required set the API enforces would otherwise leave the model no way to decline, so
 * two channels carry a refusal instead: a page describing no single event, a listing or an error page among them, is
 * typed as such and dropped whole, and a required property the page leaves unstated comes back blank and is pruned.
 * Both cost a request, and neither reaches the rest of the pipe.
 *
 * Every event is emitted as a {@link Partial} record for a downstream step to validate.
 *
 * > [!NOTE]
 * >
 * > - **Incremental**: each event is emitted as soon as it is extracted, so the feed produced runs dry as the feed
 * >   drawn from does and an endless source is read as long as it is consumed.
 * > - **Streaming**: pages are extracted one item at a time, none retained.
 * > - **Stateless**: every page is extracted on its own, so the outcome is unaffected by how the feed is split across
 * >   nested feeds or runs.
 *
 * The client is resolved as the task is created, so the enclosing execution must already be running by then and every
 * page drawn is extracted through the same client, however long the feed runs. The prompt steering the extraction is
 * read from the `.sys.md` file shipped alongside this module, so a deployment must carry it next to the compiled
 * code.
 *
 * @param options The extraction options
 * @param options.model The Gemini model events are extracted by; if undefined, a general-purpose model is used
 *
 * @returns A task converting a feed of markdown event pages into a feed of the events they state
 *
 * @throws {Error} If no execution is running, as the Gemini client is resolved from the enclosing one
 *
 * @throws {Error} While the feed is consumed, if the prompt shipped alongside the module cannot be read, whatever the
 * source reports while producing pages, whatever the API reports on a request it cannot recover from, or if the model
 * replies with no output text or with malformed JSON
 */
export function extract({

	model = "gemini-3.5-flash-lite"

}: {

	model?: string

} = {}): Task<Text, Partial<Event>> {

	const ai = service(createGoogleAI);

	return feed => pipe(feed

		(map(async document => ({ document, extraction: json<Extraction>(await ai.models.generateContent({

			model,

			contents: [
				markdown`
					- date: ${new Date().toISOString().slice(0, 10)}
				`,
				document
			],

			config: {

				seed: 0,

				systemInstruction: await file(".sys.md", import.meta.url),

				responseMimeType: "application/json",
				responseSchema: {

					type: Type.OBJECT,

					properties: {

						documentType: {
							type: Type.STRING,
							format: "enum",
							enum: ["event", "other"],
							description: "Whether the document describes exactly one event, or something else"
						},

						title: {
							type: Type.STRING,
							description: "The event title"
						},

						summary: {
							type: Type.STRING,
							description: "A plain text summary of less than 500 characters, with no markdown formatting"
						},

						description: {
							type: Type.STRING,
							description: "The complete descriptive text of the event, in markdown format"
						},

						startDate: {
							type: Type.STRING,
							description: "The start date as an ISO calendar date (yyyy-mm-dd)"
						},

						startTime: {
							type: Type.STRING,
							description: "The start time as an ISO wall clock time without seconds (hh:mm)"
						},

						endDate: {
							type: Type.STRING,
							description: "The end date as an ISO calendar date (yyyy-mm-dd)"
						},

						endTime: {
							type: Type.STRING,
							description: "The end time as an ISO wall clock time without seconds (hh:mm)"
						},

						entryFees: {
							type: Type.STRING,
							format: "enum",
							enum: ["free", "paid"],
							description: "The entry cost"
						},

						attendanceMode: {
							type: Type.STRING,
							format: "enum",
							enum: ["offline", "online", "mixed"],
							description: "The way the event is attended"
						},

						attendanceURL: {
							type: Type.STRING,
							description: "The URL for attending the event remotely"
						},

						venueName: {
							type: Type.STRING,
							description: "The name of the venue"
						},

						venueAddress: {
							type: Type.STRING,
							description: "The street address of the venue"
						},

						venueCity: {
							type: Type.STRING,
							description: "The city the venue is located in"
						},

						imageURL: {
							type: Type.STRING,
							description: "The URL of the image illustrating the event, query component included"
						},

						imageCredits: {
							type: Type.STRING,
							description: "The credits or the copyright notice for the image"
						},

						topic: {
							type: Type.STRING,
							description: "The major topic of the event"
						},

						audience: {
							type: Type.STRING,
							description: "The intended audience of the event"
						}

					},

					required: ["documentType", "title", "description", "startDate"]

				}

			}

		})) })))

		(filter(({ extraction }) => extraction.documentType === "event"))

		(map(({

			document,

			extraction: { documentType, title, description, startDate, imageURL, ...rest }

		}): Partial<Event> => {

			const image = imageURL || Image.exec(document)?.[1];

			return {

				...rest,

				...(title ? { title } : {}),
				...(description ? { description } : {}),
				...(startDate ? { startDate } : {}),
				...(image ? { imageURL: image } : {})

			};

		}))

	);

}


/**
 * A record as the model reports it, before the pipe prunes it into an {@link Event}.
 *
 * Carries the document type the model is required to state, and the blanks it emits in place of a required property
 * the page leaves unstated.
 */
interface Extraction extends Partial<Event> {

	/** Whether the page describes exactly one event, or something else. */
	readonly documentType?: "event" | "other";

}
