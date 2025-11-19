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

import { matches, merge, stale } from "@/pipelines/units";
import { units } from "@/pipelines/units/store";
import { index } from "@/pipelines/units/tasks";
import { analyze } from "@/pipelines/units/tasks/analyze";
import { classify } from "@/pipelines/units/tasks/classify";
import { guard, log, message, time } from "@metreeca/core/logger";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { forEach } from "@metreeca/flow/sinks";
import { flatMap, map } from "@metreeca/flow/tasks";


const logger = log(import.meta.url);

if ( import.meta.main ) {
	_analyze();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function _analyze(): Promise<number> {

	return time(() => pipe(
		(items(units.select({ analyzed: Date.now()-stale })))
			// (items(units.select()))
			(flatMap(lead => pipe(
				items(lead)
				(map(guard(analyze)))
				(map(guard(classify)))
				(map(guard(index)))
				(map(item => merge(lead, {

					...item,

					updated: matches(lead, item) ? lead.updated : Date.now(),
					analyzed: Date.now()

				})))
			), {
				parallel: true
			}))
			(forEach(units.insert))
	), (count, elapsed) => {
		logger.info`processed <${count}> units in <${message(elapsed)}> ms`;
	});

}
