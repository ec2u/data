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
import { isArray, opt, type Optional } from "@metreeca/core";
import { resolve } from "@metreeca/core/resource";
import { clip } from "@metreeca/core/strings";
import { type Feed, pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";
import { fetch } from "@metreeca/pipe-url";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { type Draft, sync } from "../sinks/sync.js";
import { course, type CourseRecord, program, type ProgramRecord, text } from "./salamanca.core.js";


const Source = resolve(base, "/offerings/salamanca");

const ProgramsURL = "offerings-salamanca-programs-url";
const CoursesURL = "offerings-salamanca-courses-url";
const MembershipsURL = "offerings-salamanca-programs-courses-url";


const logger = log(import.meta.url);


/**
 * A program-course membership record of the Salamanca memberships API.
 */
type MembershipRecord = {

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
 * the listed programs it is taught in. A memberships listing that fails to load, or comes back empty, is logged and
 * links no course to its programs until a later run reads it again, while programs and courses are still stated.
 *
 * @returns A promise resolving to a tally of what the run did
 */
export async function Salamanca() {

	const vault = service(createVault);

	const [programs, memberships] = await Promise.all([
		listing<ProgramRecord>(await vault(ProgramsURL)),
		listing<MembershipRecord>(await vault(MembershipsURL))
	]);

	if ( memberships.length === 0 ) {
		logger.error`empty program-course memberships listing`;
	}

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
