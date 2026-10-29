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
import { getTopicId } from "@ec2u/data-shared/taxonomies/index.js";
import { isced2011 } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { stakeholders } from "@ec2u/data-shared/taxonomies/stakeholders.js";
import { linz } from "@ec2u/data-shared/universities/index.core.js";
import { isArray, isNumber, isObject, isString, opt } from "@metreeca/core";
import { multiple } from "@metreeca/core/arrays";
import { resolve } from "@metreeca/core/resource";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { type Feed, pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { distinct, flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";
import { fetch } from "@metreeca/pipe-url";
import type { Reference } from "@metreeca/qest/state";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { type CourseDraft, type Dictionary, type Draft, type ProgramDraft, sync } from "../sinks/sync.js";
import { isWeb, text } from "../index.core.js";


const Source = resolve(base, "/offerings/linz");

const ProgramsURL = "programs-linz-url";
const CoursesURL = "courses-linz-url";

const Audiences: { readonly [audience: string]: Reference } = {
	"Lifelong Learning": getTopicId(stakeholders, "teaching/students/continuing-education")
};


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Linz);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the programs and courses listed by the Linz offerings APIs.
 *
 * Retrieves each listing and reads it as a JSON array, one draft per program or course, as {@link program} and
 * {@link course} describe; an offering listed more than once is stated once. A listing that fails to be retrieved, or
 * that answers with anything other than an array, yields no drafts at all, so the run retracts nothing on the strength
 * of it; a record that cannot be read is logged and dropped, so it costs only itself rather than the listing.
 *
 * @returns A promise resolving to a tally of what the run did
 */
export async function Linz() {

	const vault = service(createVault);

	return pipe(
		(flat(items([
			listing(await vault(ProgramsURL), program),
			listing(await vault(CoursesURL), course)
		])))
		(sync(Source))
	);


	function listing(url: string, reader: (record: unknown) => undefined | Draft): Feed<Draft> {
		return pipe(
			(items([url]))
			(records())
			(flat(map(record => read(record, reader))))
			(distinct(({ key }) => key))
		);
	}

	function records(): Task<string, unknown> {
		return urls => pipe(
			(items(urls))
			(fetch())
			(flat(map(async response => {

				const json: unknown = await response.json();

				if ( isArray(json) ) {

					return json;

				} else {

					logger.error`unexpected response <${clip(JSON.stringify(json), 100)}>`;

					return [];

				}

			})))
		);
	}

	function read(record: unknown, reader: (record: unknown) => undefined | Draft): readonly Draft[] {

		const draft = reader(record);

		if ( draft === undefined ) {

			logger.warning`malformed record <${clip(JSON.stringify(record), 100)}>`;

			return [];

		} else {

			return [draft];

		}

	}

}


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
export function program(record: unknown): undefined | ProgramDraft {
	return isObject(record) ? opt(first(record.identifier), key => opt(localized(record.name), name => immutable({

		kind: "program",

		university: linz,
		key,

		identifier: key,
		url: urls(record.url),

		name,
		...opt(localized(record.description), description => ({ description })),

		...opt(credits(record.numberOfCredits), numberOfCredits => ({ numberOfCredits })),
		educationalLevel: level(record.educationalLevel)

	}))) : undefined;
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
export function course(record: unknown): undefined | CourseDraft {
	return isObject(record) ? opt(text(record.courseCode), key => opt(localized(record.name), name => immutable({

		kind: "course",

		university: linz,
		key,

		courseCode: key,
		url: urls(record.url),

		name,
		...opt(localized(record.description), description => ({ description })),

		...opt(credits(record.numberOfCredits), numberOfCredits => ({ numberOfCredits })),
		educationalLevel: level(record.educationalLevel),

		audience: (isArray(record.audience) ? record.audience : [])
			.map(audience => isString(audience) ? Audiences[audience] : undefined)
			.flatMap(multiple),

		inProgram: (isArray(record.inProgram) ? record.inProgram : [])
			.map(program => isObject(program) ? opt(first(program.identifier), key => ({ key })) : undefined)
			.flatMap(multiple)

	}))) : undefined;
}


/**
 * Reads the first non-blank string of a list, trimmed.
 */
function first(value: unknown): undefined | string {
	return isArray(value) ? value.map(text).find(isString) : undefined;
}

/**
 * Reads the non-blank texts of a language map, trimmed and keyed by lowercase language tag.
 */
function localized(value: unknown): undefined | Dictionary {

	const texts: Dictionary = isObject(value) ? Object.fromEntries(Object.entries(value).flatMap(([tag, value]) =>
		opt(text(value), text => [[tag.toLowerCase(), text]]) ?? []
	)) : {};

	return Object.keys(texts).length > 0 ? texts : undefined;

}

function urls(value: unknown): readonly string[] {
	return (isArray(value) ? value : []).filter(isString).filter(isWeb);
}

function credits(value: unknown): undefined | number {
	return isNumber(value) && Number.isFinite(value) && value >= 0 ? value : undefined;
}

/**
 * Maps the legacy ISCED 2011 concept address the API states to the matching topic of the ISCED 2011 taxonomy.
 */
function level(value: unknown): readonly Reference[] {
	return opt(isString(value) ? /^https:\/\/data\.ec2u\.eu\/concepts\/isced-2011\/(\d)$/.exec(value) ?? undefined : undefined,
		([, code]) => [getTopicId(isced2011, code)]
	) ?? [];
}
