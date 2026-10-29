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

import { base } from "@ec2u/data-shared";
import { salamanca } from "@ec2u/data-shared/universities/index.core.js";
import { isArray, isNumber, opt, type Optional } from "@metreeca/core";
import { multiple } from "@metreeca/core/arrays";
import { resolve } from "@metreeca/core/resource";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { type Feed, pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";
import { fetch } from "@metreeca/pipe-url";
import { log } from "@metreeca/tape";
import { isHTTP } from "@metreeca/work/core/resources.js";
import { execute } from "../../index.core.js";
import { type CourseDraft, type Draft, type ProgramDraft, sync } from "../sinks/sync.js";


const Source = resolve(base, "/offerings/salamanca");

const ProgramsURL = "offerings-salamanca-programs-url";
const CoursesURL = "offerings-salamanca-courses-url";
const MembershipsURL = "offerings-salamanca-programs-courses-url";

const Periods: { readonly [code: string]: string } = {
	A: "P365D",
	S: "P180D",
	Q: "P120D",
	T: "P90D"
};


const logger = log(import.meta.url);


/**
 * A program record of the Salamanca programs API.
 */
export type ProgramRecord = {

	readonly programCode?: null | string
	readonly programName?: null | string
	readonly programUrl?: null | string

}

/**
 * A course record of the Salamanca courses API.
 */
export type CourseRecord = {

	readonly code?: null | string
	readonly nameInEnglish?: null | string
	readonly nameInSpanish?: null | string
	readonly url?: null | string

	readonly ects?: null | number | string
	readonly field_guias_asig_tdu_value?: null | string

}

/**
 * A program-course membership record of the Salamanca memberships API.
 */
export type MembershipRecord = {

	readonly code?: null | string
	readonly programCode?: null | string

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Salamanca);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the programs and courses listed by the Salamanca study guides APIs.
 *
 * Reads the programs listing and the program-course memberships first, then the courses listing, each course linked to
 * the listed programs it is taught in. A memberships listing that fails to load, or comes back empty, fails the run
 * before anything is stated, so courses are never restated without the programs they belong to.
 *
 * @returns A promise resolving to a tally of what the run did
 *
 * @throws {@link !Error Error} If the memberships listing fails to load or lists no membership
 */
export async function Salamanca() {

	const vault = service(createVault);

	const [programs, memberships] = await Promise.all([
		listing<ProgramRecord>(await vault(ProgramsURL)),
		listing<MembershipRecord>(await vault(MembershipsURL))
	]);

	if ( memberships.length === 0 ) {

		throw new Error("empty program-course memberships listing");

	} else {

		const listed = programs.flatMap(record => read(record, program));
		const index = programsByCourse(memberships, new Set(listed.map(({ key }) => key)));

		const taught: Feed<Draft> = pipe(
			(items([await vault(CoursesURL)]))
			(records<CourseRecord>())
			(flat(map(record => read(record, record => course(record, index)))))
		);

		return pipe(
			(flat(items([items<Draft>(listed), taught])))
			(sync(Source))
		);

	}

}


/**
 * Indexes the listed programs each course is taught in, as the program-course memberships state them.
 */
function programsByCourse(
	memberships: readonly MembershipRecord[], listed: ReadonlySet<string>
): ReadonlyMap<string, readonly string[]> {

	const pairs = memberships.flatMap(({
		code,
		programCode
	}) => opt(text(code), course => opt(text(programCode), program =>
		listed.has(program) ? [{ course, program }] : []
	)) ?? []);

	return new Map([...new Set(pairs.map(({ course }) => course))].map(course =>
		[course, [...new Set(pairs.filter(pair => pair.course === course).map(({ program }) => program))]]
	));

}


async function listing<R>(url: string): Promise<readonly R[]> {
	return pipe(
		(items([url]))
		(records<R>())
		(toArray())
	);
}

/**
 * Retrieves JSON array listings, yielding their records; a listing that fails or is no array yields none.
 */
function records<R>(): Task<string, R> {
	return urls => pipe(
		(items(urls))
		(fetch())
		(flat(map(async response => {

			const json: unknown = await response.json();

			if ( isArray<R>(json) ) {

				return json;

			} else {

				logger.error`unexpected response <${clip(JSON.stringify(json), 100)}>`;

				return [];

			}

		})))
	);
}

function read<R, D extends Draft>(record: R, reader: (record: R) => Optional<D>): readonly D[] {

	const draft = reader(record);

	if ( draft === undefined ) {

		logger.warning`malformed record <${clip(JSON.stringify(record), 100)}>`;

		return [];

	} else {

		return [draft];

	}

}


/**
 * Reads a program record of the Salamanca programs API.
 *
 * The program is keyed by its `programCode`, which it also states as its identifier, and named in Spanish by its
 * `programName`; its `programUrl` is stated as its web page. Values are stripped of the stray quotes some reach the
 * API wrapped in, and blank ones are left out as if the record did not state them at all.
 *
 * @param record The program record as the API states it
 *
 * @returns The draft of the program, or `undefined` if the record states no code or no name
 */
export function program({ programCode, programName, programUrl }: ProgramRecord): Optional<ProgramDraft> {
	return opt(text(programCode), key => opt(text(programName), name => immutable({

		kind: "program",

		university: salamanca,
		key,

		identifier: key,
		name: { [salamanca.locale]: name },
		url: [text(programUrl)].flatMap(multiple).filter(isHTTP)

	})));
}

/**
 * Reads a course record of the Salamanca courses API.
 *
 * The course is keyed by its `code`, which it also states as its course code, and named in English and Spanish by its
 * `nameInEnglish` and `nameInSpanish`; its `url` is stated as its web page and its `ects` as its credits. The teaching
 * period code `field_guias_asig_tdu_value` sets the time the course requires: a year for `A`, a semester for `S`, four
 * months for `Q` and three for `T`. The course is linked to the programs `memberships` lists it under.
 *
 * @param record The course record as the API states it
 * @param memberships The codes of the listed programs each course is taught in, keyed by course code
 *
 * @returns The draft of the course, or `undefined` if the record states no code or no name
 */
export function course({
	code, nameInEnglish, nameInSpanish, url, ects, field_guias_asig_tdu_value
}: CourseRecord, memberships: ReadonlyMap<string, readonly string[]>): Optional<CourseDraft> {

	const english = text(nameInEnglish);
	const spanish = text(nameInSpanish);

	return opt(text(code), key => english === undefined && spanish === undefined ? undefined : immutable({

		kind: "course",

		university: salamanca,
		key,

		courseCode: key,
		name: {
			...opt(english, en => ({ en })),
			...opt(spanish, es => ({ [salamanca.locale]: es }))
		},
		url: [text(url)].flatMap(multiple).filter(isHTTP),

		...opt(credits(ects), numberOfCredits => ({ numberOfCredits })),
		...opt(Periods[text(field_guias_asig_tdu_value) ?? ""], timeRequired => ({ timeRequired })),

		inProgram: (memberships.get(key) ?? []).map(program => ({ key: program }))

	}));

}


/**
 * Reads a non-blank string, trimmed and stripped of a matching pair of leading and trailing quotes.
 */
function text(value: Optional<null | string>): Optional<string> {
	return value?.trim().replace(/^(['"]+)(.*?)\1$/s, "$2").trim() || undefined;
}

function credits(value: Optional<null | number | string>): Optional<number> {
	return opt(isNumber(value) ? value : opt(text(value), Number.parseFloat), credits =>
		Number.isFinite(credits) && credits > 0 ? credits : undefined
	);
}
