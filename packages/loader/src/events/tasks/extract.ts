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

import { getDate } from "@metreeca/work/core/temporal.js";
import { when } from "@metreeca/work/flow/when.js";
import { digest } from "@metreeca/work/tide-store/_digest.js";
import { validate } from "@metreeca/work/tide-store/validate.js";
import { file } from "@metreeca/work/gear/files.js";
import { createGoogleAI, json, schema } from "@metreeca/work/muse-google/index.js";
import { isStaleEvent } from "@ec2u/data-loader/events/index.js";
import { boolean } from "@metreeca/blue/boolean";
import { optional, required, resource } from "@metreeca/blue/resource";
import { date, string, tag, time, url } from "@metreeca/blue/string";
import type { Instance } from "@metreeca/blue/value";
import { markdown, type Text } from "@metreeca/core/strings";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";


export function Extracted() {
	return resource(Reported, {

		name: "Extracted Event",
		description: "A reported event with the publication status and the source digest the pipeline settles itself"

	}, {

		publishable: required(boolean, {
			name: "Fit for Publication",
			description: "Whether the event is to be carried downstream, being an event and not yet past"
		}),

		digest: required(string, {
			name: "Source Digest",
			description: `
				A unique digest of the source document the event was extracted from, identifying the content the
				document carried rather than the document itself, so that a later run tells by comparison whether
				the source has since changed and the event is to be extracted again.
			`
		})

	});
}

export function Reported() {
	return resource({

		name: "Reported Event",
		description: "An academic or cultural event as a source document describes it"

	}, {

		event: required(boolean, {
			name: "Single Event",
			description: `
				Whether the document describes a single event; false for an index or listing, a page carrying no event
				content, and a page mentioning events only in passing. An event happening more than once is still a
				single event.
			`
		}),

		url: required(url, {
			name: "Source Address",
			description: `
				The address the document was retrieved from, copied verbatim from the \`url\` field of the frontmatter,
				query component included; never a link found in the body, a canonical link or a shortened form.
			`
		}),

		title: required(string, {
			name: "Event Title",
			description: `
				The title of the event alone in English, stripped of the page furniture the document builds its heading
				out of: a site name, a publication or section name, a tagline and a breadcrumb trail.
			`
		}),

		summary: optional(string, {
			name: "Short Summary",
			description: "A plain text summary in English of less than 500 characters, with no markdown formatting"
		}),

		description: required(string, {
			name: "Full Description",
			description: `
				The complete descriptive text in English as the document includes it, in markdown format, carrying over
				neither the H1 heading stating the title nor navigation, listings of other events or the page as a
				whole.
			`
		}),

		startDate: required(date, {
			name: "First Day",
			description: "The date the event starts on, resolving relative dates against the current date"
		}),

		startTime: optional(time, {
			name: "Starting Hour",
			description: `
				The local time a clock at the venue reads as the event starts, whatever notation the document states it
				in; left out for a recurring event, which has no start time of its own.
			`
		}),

		endDate: optional(date, {
			name: "Last Day",
			description: "The date the event ends on, resolving relative dates against the current date"
		}),

		endTime: optional(time, {
			name: "Closing Hour",
			description: `
				The local time a clock at the venue reads as the event ends, whatever notation the document states it
				in; left out for a recurring event, which has no end time of its own.
			`
		}),

		entryFees: optional(string, {
			name: "Cost of Entry",
			description: `
				Whether the event is free or paid, stated only where the document leaves no doubt and never drawn from a
				registration requirement.
			`
		}),

		attendanceMode: optional(string, {
			name: "Way of Attending",
			description: "Whether the event is attended offline, online or in both modes"
		}),

		attendanceURL: optional(url, {
			name: "Online Address",
			description: "The address the event is attended at, stated only where attendance is online or mixed"
		}),

		venueName: optional(string, {
			name: "Venue Name",
			description: "The name of the venue, as the document states it"
		}),

		venueAddress: optional(string, {
			name: "Street Address",
			description: "The street address of the venue, as the document states it"
		}),

		venuePostalCode: optional(string, {
			name: "Postal Code",
			description: "The postal code of the venue, as the document states it"
		}),

		venueCity: optional(string, {
			name: "City",
			description: "The city the venue is in, as the document states it"
		}),

		imageURL: optional(url, {
			name: "Image URL",
			description: "The address of the image illustrating the event, stated only where reasonably sure"
		}),

		imageCredits: optional(string, {
			name: "Picture Credits",
			description: "The credits or copyright of the image, as the document states them"
		}),

		language: required(tag, {
			name: "Document Language",
			description: `
				The language the document is written in, as a 2-letter ISO tag, never the English the properties are
				stated in.
			`
		})

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function extract(): Task<Text, Instance<typeof Extracted>> {

	const ai = service(createGoogleAI);

	return documents => pipe(
		(items(documents))
		(flat(map(async document => pipe(
			(items([

				json<Instance<typeof Reported>>(await ai.models.generateContent({

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
						responseSchema: schema(Reported)

					}

				}))

			]))
			(when(extracted => extracted.event, validate(Reported)))
			(map(extracted => ({

				publishable: extracted.event && !isStaleEvent(extracted),

				digest: digest(document),

				...extracted

			})))
		))))
	);

}
