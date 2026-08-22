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

import { matches, merge } from "@/_datasets/units/index.js";
import { _units } from "@/_datasets/units/store.js";
import { analyze } from "@/_datasets/units/tasks/analyze/analyze.js";
import { annotate } from "@/_datasets/units/tasks/analyze/annotate.js";
import { classify } from "@/_datasets/units/tasks/analyze/classify.js";
import { universities } from "@/universities/index.js";
import { pipe } from "@metreeca/pipe";
import { items } from "@metreeca/pipe/feeds";
import { forEach } from "@metreeca/pipe/sinks";
import { flatMap, map } from "@metreeca/pipe/tasks";
import { log, report, time } from "@metreeca/tape";


// ============================================================================
// WARNING: TLS CERTIFICATE VERIFICATION DISABLED
// ============================================================================
// This disables SSL/TLS certificate verification for ALL HTTPS requests
// in this Node.js process. This is required because some university servers
// (*.dip.unipv.it) have misconfigured certificates (incomplete chain).
//
// SECURITY RISK: This makes the application vulnerable to man-in-the-middle
// attacks. Only use this in trusted network environments.
//
// TO RE-ENABLE: Comment out or remove the line below.
// ============================================================================
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


const logger = log(import.meta.url);


if ( import.meta.main ) {
	execute();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default async function execute(): Promise<number> {

	return time(() => pipe(
		// (items(units.select({ analyzed: Date.now()-stale }))) // !!!

		(items(_units.select({ university: universities.pavia })))

		(flatMap(lead => pipe(
			items(lead)
			(map(log(analyze)))
			(map(log(classify)))
			(map(log(annotate)))
			(map(item => merge(lead, {

				...item,

				updated: matches(lead, item) ? lead.updated : Date.now(),
				analyzed: Date.now()

			})))
		), {
			parallel: true
		}))
		(forEach(_units.insert))
	), (count, elapsed) => {
		logger.info`processed <${count}> units in <${report(elapsed)}> ms`;
	});

}
