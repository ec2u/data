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
import { isArray, type Optional } from "@metreeca/core";
import { resolve } from "@metreeca/core/resource";
import { clip } from "@metreeca/core/strings";
import { type Feed, pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { distinct, flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";
import { fetch } from "@metreeca/pipe-url";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { type Draft, sync } from "../sinks/sync.js";
import { course, program } from "./linz.core.js";


const Source = resolve(base, "/offerings/linz");

const ProgramsURL = "programs-linz-url";
const CoursesURL = "courses-linz-url";


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


	function listing<R>(url: string, reader: (record: R) => Optional<Draft>): Feed<Draft> {
		return pipe(
			(items([url]))
			(records<R>())
			(flat(map(record => read(record, reader))))
			(distinct(({ key }) => key))
		);
	}

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

	function read<R>(record: R, reader: (record: R) => Optional<Draft>): readonly Draft[] {

		const draft = reader(record);

		if ( draft === undefined ) {

			logger.warning`malformed record <${clip(JSON.stringify(record), 100)}>`;

			return [];

		} else {

			return [draft];

		}

	}

}
