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

import { Units } from "@/units/index.js";
import { expand } from "@/units/tasks/expand/expand.js";
import { _units } from "@/units/store.js";
import * as uuid from "uuid";
import { pipe } from "@metreeca/pipe";
import { feed, items } from "@metreeca/pipe/feeds";
import { forEach, toArray } from "@metreeca/pipe/sinks";
import { concurrent, filter, flatMap, map } from "@metreeca/pipe/tasks";
import { log, report, time } from "@metreeca/tape";


const Concurrency = 32;


const logger = log(import.meta.url);


if ( import.meta.main ) {
	await expandAll();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function expandAll(): Promise<number> {
	return time(() => pipe(
		// (items(units.select({ expanded: Date.now()-stale }))) // !!!

		(feed(_units.select()))
			// (filter(u => u.website === "https://fisica.dip.unipv.it/")) // !!!
			(filter(u => u.website === "https://iii.dip.unipv.it/")) // !!!

			(concurrent(Concurrency, map(async lead => ({
				lead, items: await pipe(
					(items(lead))
					(flatMap(async item => await log(expand)(item) ?? []))
					(map(item => ({

						...item,

						parent: lead.id,
						university: lead.university

					})))
					(toArray())
				)

			}))))
			(forEach(async ({ lead, items }) => {

				for (const item of items) {
					if ( !await _units.lookup(item) ) { // check and update atomically
						await _units.insert({ ...item, id: `${Units}${uuid.v4()}` });
					}
				}

				await _units.insert({ ...lead, expanded: Date.now() });

			}))
	), (count, elapsed) => { // !!! broken count
		logger.info`identified <${count}> units in <${report(elapsed)}> ms`;
	});
}
