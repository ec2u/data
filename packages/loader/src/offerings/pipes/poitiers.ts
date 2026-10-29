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
import { resolve } from "@metreeca/core/resource";
import { clip } from "@metreeca/core/strings";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { type ProgramDraft, sync } from "../sinks/sync.js";
import { type Entry, program } from "./poitiers.core.js";
import snapshot from "./poitiers.json" with { type: "json" };


const Source = resolve(base, "/offerings/poitiers");


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Poitiers);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the programs of the Poitiers catalogue snapshot.
 *
 * Reads the one-off extract of the Poitiers training offer bundled with the loader, keyed by program code, as no live
 * feed is available yet; courses are not ingested. The snapshot states no academic year, so the sink dates its programs
 * with the one current at retrieval, switching in August.
 *
 * @returns A promise resolving to a tally of what the run did
 */
export async function Poitiers() {
	return pipe(
		(items(Object.values(snapshot)))
		(flat(map(read)))
		(sync(Source))
	);
}


function read(entry: Entry): readonly ProgramDraft[] {

	const draft = program(entry);

	if ( draft === undefined ) {

		logger.warning`malformed entry <${clip(JSON.stringify(entry), 100)}>`;

		return [];

	} else {

		return [draft];

	}

}
