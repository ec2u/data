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

import { salamanca } from "@ec2u/data-shared/universities/index.core.js";
import { isNumber, opt, type Optional } from "@metreeca/core";
import { multiple } from "@metreeca/core/arrays";
import { immutable } from "@metreeca/core/values";
import { isHTTP } from "@metreeca/work/core/resources.js";
import type { CourseDraft, ProgramDraft } from "../sinks/sync.js";


const Periods: { readonly [code: string]: string } = {
	A: "P365D",
	S: "P180D",
	Q: "P120D",
	T: "P90D"
};


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
export function text(value: Optional<null | string>): Optional<string> {
	return value?.trim().replace(/^(['"]+)(.*?)\1$/s, "$2").trim() || undefined;
}

function credits(value: Optional<null | number | string>): Optional<number> {
	return opt(isNumber(value) ? value : opt(text(value), Number.parseFloat), credits =>
		Number.isFinite(credits) && credits > 0 ? credits : undefined
	);
}
