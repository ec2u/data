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

import { units } from "@/pipelines/units/store";
import { expand } from "@/pipelines/units/tasks/expand";
import { Units } from "@/utilities/hub";
import { uuid } from "@/utilities/node/uuid";
import { guard, log, message, time } from "@metreeca/core/logger";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { forEach, toArray } from "@metreeca/flow/sinks";
import { filter, flatMap, map } from "@metreeca/flow/tasks";

const logger = log(import.meta.url);


if ( import.meta.main ) {
	_expand();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function _expand(): Promise<number> {

	return time(() => pipe(
			// (items(units.select({ expanded: Date.now()-stale }))) // !!!

			(items(units.select()))
				// (filter(u => u.website === "https://fisica.dip.unipv.it/")) // !!!
				(filter(u => u.website === "https://iii.dip.unipv.it/")) // !!!

				(map(async lead => ({
					lead, items: await pipe(
						(items(lead))
						(flatMap(guard(expand)))
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
		), (count, elapsed) => logger.info // !!! broken count
			`identified <${count}> units in <${message(elapsed)}> ms`
	);

}
