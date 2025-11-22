/*
 * Copyright © 2020-2025 EC2U Alliance
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

import { expand } from "@/datasets/units/pipes/expand/expand.js";
import { units } from "@/datasets/units/store.js";
import { Units } from "@/utilities/hub/index.js";
import { uuid } from "@/work/node/uuid.js";
import { message, time } from "@metreeca/core/report";
import { pipe } from "@metreeca/pipe";
import { items } from "@metreeca/pipe/feeds";
import { forEach, toArray } from "@metreeca/pipe/sinks";
import { filter, flatMap, map } from "@metreeca/pipe/tasks";
import { log } from "@metreeca/tape";


const logger = log(import.meta.url);


if ( import.meta.main ) {
	await expandAll();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function expandAll(): Promise<number> {
	return time(() => pipe(
		// (items(units.select({ expanded: Date.now()-stale }))) // !!!

		(items(units.select()))
			// (filter(u => u.website === "https://fisica.dip.unipv.it/")) // !!!
			(filter(u => u.website === "https://iii.dip.unipv.it/")) // !!!

			(map(async lead => ({
				lead, items: await pipe(
					(items(lead))
					(flatMap(log(expand)))
					(map(item => ({

						...item,

						parent: lead.id,
						university: lead.university

					})))
					(toArray())
				)

			}), {
				parallel: true
			}))
			(forEach(async ({ lead, items }) => {

				for (const item of items) {
					if ( !await units.lookup(item) ) { // check and update atomically
						await units.insert({ ...item, id: `${Units}${uuid()}` });
					}
				}

				await units.insert({ ...lead, expanded: Date.now() });

			}))
	), (count, elapsed) => { // !!! broken count
		logger.info`identified <${count}> units in <${message(elapsed)}> ms`;
	});
}
