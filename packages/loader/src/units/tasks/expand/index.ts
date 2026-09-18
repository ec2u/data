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


import { units } from "@/units/index.js";
import { _units } from "@/units/store.js";
import { expand } from "@/units/tasks/expand/expand.js";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { each, toArray } from "@metreeca/flow/sinks";
import { filter, flat, fork, map } from "@metreeca/flow/tasks";
import { log, report, time } from "@metreeca/tape";
import * as uuid from "uuid";


const Concurrency = 32;


const logger = log(import.meta.url);


if ( import.meta.main ) {
	await expandAll();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function expandAll(): Promise<number> {
	return time(async () => pipe(
		// (items(units.select({ expanded: Date.now()-stale }))) // !!!

		(items(await _units.select()))
			// (filter(u => u.website === "https://fisica.dip.unipv.it/")) // !!!
			(filter(u => u.website === "https://iii.dip.unipv.it/")) // !!!

			(fork(Concurrency, map(async lead => ({
				lead, items: await pipe(
					(items(lead))
					(map(async item => items(await log(expand)(item) ?? [])))
					(flat())
					(map(item => ({

						...item,

						parent: lead.id,
						university: lead.university

					})))
					(toArray())
				)

			}))))
			(each(async ({ lead, items }) => {

				for (const item of items) {
					if ( !await _units.lookup(item) ) { // check and update atomically
						await _units.insert({ ...item, id: `${units.id}/${uuid.v4()}` });
					}
				}

				await _units.insert({ ...lead, expanded: Date.now() });

			}))
	), (count, elapsed) => { // !!! broken count
		logger.info`identified <${count}> units in <${report(elapsed)}> ms`;
	});
}
