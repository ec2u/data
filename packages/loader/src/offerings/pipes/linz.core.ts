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
import { stakeholders } from "@ec2u/data-shared/taxonomies/stakeholders.js";
import { linz } from "@ec2u/data-shared/universities/index.core.js";
import { opt, type Optional } from "@metreeca/core";
import { multiple } from "@metreeca/core/arrays";
import { immutable } from "@metreeca/core/values";
import type { Reference } from "@metreeca/qest/state";
import { isHTTP } from "@metreeca/work/core/resources.js";
import type { CourseDraft, Dictionary, ProgramDraft } from "../sinks/sync.js";


const Audiences: { readonly [audience: string]: Reference } = {
	"Lifelong Learning": getTopicId(stakeholders, "teaching/students/continuing-education")
};


/**
 * A program record of the Linz programs API.
 */
export type ProgramRecord = {

	readonly identifier?: readonly string[]
	readonly url?: readonly string[]

	readonly name?: Texts
	readonly description?: Texts

	readonly numberOfCredits?: null | number
	readonly educationalLevel?: null | string

}

/**
 * A course record of the Linz courses API.
 */
export type CourseRecord = Omit<ProgramRecord, "identifier"> & {

	readonly courseCode?: null | string

	readonly audience?: readonly string[]
	readonly inProgram?: readonly Pick<ProgramRecord, "identifier">[]

}

/**
 * Texts keyed by language tag.
 */
export type Texts = { readonly [tag: string]: null | string };


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Reads a program record of the Linz programs API.
 *
 * The program is keyed by its first identifier, which it also states as its identifier; its names and descriptions
 * are kept in the languages the record states them in, leaving out blank texts. Its web pages, credits and ISCED 2011
 * level are stated where the record gives them in a usable form, the level being mapped from the legacy concept
 * address the API states to the matching topic of the ISCED 2011 taxonomy, and left out where no topic matches.
 *
 * @param record The program record as the API states it
 *
 * @returns The draft of the program, or `undefined` if the record states no identifier or no name
 */
export function program({
	identifier, url, name, description, numberOfCredits, educationalLevel
}: ProgramRecord): Optional<ProgramDraft> {
	return opt(first(identifier), key => opt(localized(name), name => immutable({

		kind: "program",

		university: linz,
		key,

		identifier: key,
		url: urls(url),

		name,
		...opt(localized(description), description => ({ description })),

		...opt(credits(numberOfCredits), numberOfCredits => ({ numberOfCredits })),
		educationalLevel: level(educationalLevel)

	})));
}

/**
 * Reads a course record of the Linz courses API.
 *
 * The course is keyed by its course code, which it also states as its code; texts, web pages, credits and level are
 * read as for {@link program}. The programs the course is taught in are named by their first identifier, so they link
 * to the programs the same run states; a `Lifelong Learning` audience tags the course as addressed to continuing
 * education students, while any other audience the record states is ignored as unknown.
 *
 * @param record The course record as the API states it
 *
 * @returns The draft of the course, or `undefined` if the record states no course code or no name
 */
export function course({
	courseCode, url, name, description, numberOfCredits, educationalLevel, audience = [], inProgram = []
}: CourseRecord): Optional<CourseDraft> {
	return opt(courseCode?.trim() || undefined, key => opt(localized(name), name => immutable({

		kind: "course",

		university: linz,
		key,

		courseCode: key,
		url: urls(url),

		name,
		...opt(localized(description), description => ({ description })),

		...opt(credits(numberOfCredits), numberOfCredits => ({ numberOfCredits })),
		educationalLevel: level(educationalLevel),

		audience: audience.map(audience => Audiences[audience]).flatMap(multiple),
		inProgram: inProgram.flatMap(({ identifier }) => opt(first(identifier), key => [{ key }]) ?? [])

	})));
}


/**
 * Reads the first non-blank identifier of a list, trimmed.
 */
function first(identifiers: readonly string[] = []): Optional<string> {
	return identifiers.map(identifier => identifier.trim()).find(identifier => identifier !== "");
}

/**
 * Reads the non-blank texts of a language map, trimmed and keyed by lowercase language tag.
 */
function localized(texts: Texts = {}): Optional<Dictionary> {

	const entries = Object.entries(texts).flatMap(([tag, text]) =>
		opt(text?.trim() || undefined, text => [[tag.toLowerCase(), text]]) ?? []
	);

	return entries.length > 0 ? Object.fromEntries(entries) : undefined;

}

function urls(urls: readonly string[] = []): readonly string[] {
	return urls.filter(isHTTP);
}

function credits(credits: Optional<null | number>): Optional<number> {
	return credits !== undefined && credits !== null && Number.isFinite(credits) && credits >= 0 ? credits : undefined;
}

/**
 * Maps the legacy ISCED 2011 concept address the API states to the matching topic of the ISCED 2011 taxonomy.
 */
function level(concept: Optional<null | string>): readonly Reference[] {
	return opt(/^https:\/\/data\.ec2u\.eu\/concepts\/isced-2011\/(\d)$/.exec(concept ?? "") ?? undefined, ([, code]) =>
		[getTopicId(isced2011, code)]
	) ?? [];
}
