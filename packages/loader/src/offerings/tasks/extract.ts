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

import { getTopicId } from "@ec2u/data-shared/taxonomies/index.js";
import { isced2011 } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { schema } from "@metreeca/blue";
import { number } from "@metreeca/blue/number";
import { optional, required, resource } from "@metreeca/blue/resource";
import { duration, string, text } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { isArray, isObject, opt, type Optional } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { getResource } from "@metreeca/gear/space";
import { createGoogleAI, json } from "@metreeca/llms-google";
import { validate } from "@metreeca/mime-jsonld";
import { log, report } from "@metreeca/tape";
import type { Page } from "../sinks/crawl.js";
import type { CourseDraft, Dictionary, Draft, Entry, ProgramDraft } from "../sinks/sync.js";


const logger = log(import.meta.url);

const Modes: { readonly [mode: string]: NonNullable<CourseDraft["courseMode"]> } = {
	offline: "OfflineEventAttendanceMode",
	online: "OnlineEventAttendanceMode",
	mixed: "MixedEventAttendanceMode"
};


/**
 * The facts an offering page states, as the model reads them.
 */
export type Reported = State<typeof Reported>;


export function Reported() {
	return resource({

		name: "Extracted Offering",
		description: "An educational offering as the page describing it states it, in the language of the page"

	}, {

		language: required(string, {
			name: "Language",
			description: "The ISO 639-1 tag of the language the page is written in, in lowercase"
		}),

		name: optional(text, {
			name: "Name",
			description: "The official name of the offering"
		}),

		description: optional(string, {
			name: "Description",
			description: "The full description of the offering from the point of view of a prospective student"
		}),

		summary: optional(string, {
			name: "Summary",
			description: "A plain text summary of the description of about 500 characters"
		}),

		contents: optional(string, {
			name: "Contents",
			description: "The full description of the goals, structure and contents of the offering"
		}),

		outcomes: optional(string, {
			name: "Outcomes",
			description: "The full description of the acquired competencies or intended learning outcomes"
		}),

		requirements: optional(string, {
			name: "Requirements",
			description: "The full description of the graduation, completion or examination requirements"
		}),

		prerequisites: optional(string, {
			name: "Prerequisites",
			description: "The full description of the admission requirements"
		}),

		credits: optional(number({ minInclusive: 0 }), {
			name: "Credits",
			description: "The number of ECTS credits awarded"
		}),

		educationalCredential: optional(text, {
			name: "Educational Credential",
			description: "The name of the educational credential awarded"
		}),

		occupationalCredential: optional(text, {
			name: "Occupational Credential",
			description: "The name of the occupational credential awarded"
		}),

		level: optional(number({ minInclusive: 6, maxInclusive: 8 }), {
			name: "Level",
			description: "The ISCED 2011 level of the offering, from 6 to 8, stated only where it leaves no doubt"
		}),

		duration: optional(duration, {
			name: "Duration",
			description: "The time the offering takes to complete, as an ISO 8601 duration"
		}),

		workload: optional(duration, {
			name: "Workload",
			description: "The study workload of a course, as an ISO 8601 duration"
		}),

		code: optional(text, {
			name: "Code",
			description: "The code of a course"
		}),

		teaching: optional(string, {
			name: "Teaching Language",
			description: "The ISO 639-1 tag of the language a course is taught in, in lowercase"
		}),

		fees: optional(string({ in: ["free", "paid"] }), {
			name: "Fees",
			description: "Whether a course charges tuition fees"
		}),

		mode: optional(string({ in: ["offline", "online", "mixed"] }), {
			name: "Mode",
			description: "The attendance mode of a course"
		})

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an offering extractor.
 *
 * Drafts the offering each page describes over the seed its lead states, reading from the page content the texts,
 * credits, credentials, level, duration and, for courses, the code, workload, teaching language, fees and attendance
 * mode, all in the language the page is written in, as {@link drafted} describes. The draft is recorded with the page
 * digest, so it is extracted again only once the page or its seed changes. A page the model fails on is logged and
 * dropped rather than drafted incomplete, so that it is extracted again on the next run.
 *
 * @returns A task converting a feed of offering pages into a feed of draft entries
 */
export function extract(): Task<Page, Entry> {

	const ai = service(createGoogleAI);

	return pages => pipe(
		(items(pages))
		(flat(map(async ({ lead, document, hash }) => pipe(
			(items(await generate(lead.url, document)))
			(validate(Reported))
			(map((reported): Entry => immutable({ hash, draft: drafted(lead.seed, lead.url, reported) })))
		))))
	);


	async function generate(url: string, document: string): Promise<readonly Reported[]> {
		try {

			return [json<Reported>(await ai.models.generateContent({

				model: "gemini-3.6-flash",

				contents: document,

				config: {

					seed: 0,
					temperature: 0,

					systemInstruction: await getResource(".sys.md", import.meta.url),

					responseMimeType: "application/json",
					responseJsonSchema: schema(Reported)

				}

			}))];

		} catch ( error ) {

			logger.error`failed to extract <${url}>: ${report(error)}`;

			return [];

		}
	}

}

/**
 * Drafts an offering from what its page states over its seed.
 *
 * Every text is stated in the language the page is written in, falling back to the local language of the university
 * delivering the offering where the page language can't be told, and blank texts are left out. A fact the seed states
 * is kept as it stands; the page supplies only the facts the seed leaves out, the page address standing as the web
 * page of an offering whose seed names none. Credits are rounded to the nearest half credit. Durations stand as the
 * time a program takes to complete or the time a course requires; the course code, workload, teaching language, fees
 * and attendance mode apply to courses alone, and are never stated for a program whatever its page states.
 *
 * @param seed The seed of the lead listing the page
 * @param url The address of the page
 * @param reported The facts the page states
 *
 * @returns The draft of the offering
 */
export function drafted(seed: Draft, url: string, reported: Reported): Draft {

	const locale = /^[a-z]{2}$/.test(reported.language) ? reported.language : seed.university.locale;

	const local = (value: Optional<string>): Optional<Dictionary> => opt(value?.trim(), value =>
		value === "" ? undefined : { [locale]: value }
	);

	const common = immutable({

		generated: true,

		name: local(reported.name) ?? {},
		url: [url],

		...opt(local(reported.description), description => ({ description })),
		...opt(local(reported.summary), disambiguatingDescription => ({ disambiguatingDescription })),
		...opt(local(reported.contents), teaches => ({ teaches })),
		...opt(local(reported.outcomes), assesses => ({ assesses })),
		...opt(local(reported.requirements), competencyRequired => ({ competencyRequired })),

		...opt(reported.credits, credits => ({ numberOfCredits: Math.round(credits*2)/2 })), // nearest half credit
		educationalLevel: [reported.level].flatMap(level => isLevel(level) ? [getTopicId(isced2011, String(level))] : []),

		...opt(local(reported.educationalCredential), name => ({ educationalCredentialAwarded: degree(name) })),
		...opt(local(reported.occupationalCredential), name => ({ occupationalCredentialAwarded: degree(name) }))

	});

	if ( seed.kind === "program" ) {

		const program: ProgramDraft = immutable({

			...common,

			...opt(local(reported.prerequisites), programPrerequisites => ({ programPrerequisites })),
			...opt(reported.duration, timeToComplete => ({ timeToComplete })),

			...stated(seed),

			kind: seed.kind,
			university: seed.university,
			key: seed.key

		});

		return program;

	} else {

		const course: CourseDraft = immutable({

			...common,

			...opt(local(reported.prerequisites), coursePrerequisites => ({ coursePrerequisites })),
			...opt(reported.code?.trim() || undefined, courseCode => ({ courseCode })),
			...opt(reported.duration, timeRequired => ({ timeRequired })),
			...opt(reported.workload, courseWorkload => ({ courseWorkload })),
			...opt(reported.teaching, teaching => /^[a-z]{2}$/.test(teaching) ? { inLanguage: [teaching] } : {}),
			...opt(reported.fees, fees => ({ isAccessibleForFree: fees === "free" })),
			...opt(Modes[reported.mode ?? ""], courseMode => ({ courseMode })),

			...stated(seed),

			kind: seed.kind,
			university: seed.university,
			key: seed.key

		});

		return course;

	}

}


/**
 * Keeps the facts a seed states, leaving out the empty values standing for facts it leaves to the page.
 */
function stated<D extends Draft>(seed: D): Partial<D> {
	return Object.fromEntries(Object.entries(seed).filter(([, value]) => !(value === undefined
		|| isArray(value) && value.length === 0
		|| isObject(value) && Object.keys(value).length === 0
	))) as Partial<D>; // ;(cast) Object.fromEntries erases the entry types it rebuilds from Object.entries(seed)
}

/**
 * States a degree as the credential an offering awards.
 */
function degree(name: Dictionary): NonNullable<Draft["educationalCredentialAwarded"]> {
	return immutable({ credentialCategory: "Degree", name });
}

function isLevel(level: Optional<number>): level is number {
	return level !== undefined && Number.isInteger(level) && level >= 6 && level <= 8;
}
