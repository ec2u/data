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

import { matches, merge } from "@/datasets/units";
import { analyze } from "@/datasets/units/pipes/analyze/analyze";
import { annotate } from "@/datasets/units/pipes/analyze/annotate";
import { classify } from "@/datasets/units/pipes/analyze/classify";
import { units } from "@/datasets/units/store";
import { pavia } from "@/utilities/hub";
import { guard, log, message, time } from "@metreeca/core/logger";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { forEach } from "@metreeca/flow/sinks";
import { flatMap, map } from "@metreeca/flow/tasks";


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
	_analyze();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function _analyze(): Promise<number> {

	return time(() => pipe(
		// (items(units.select({ analyzed: Date.now()-stale }))) // !!!

		(items(units.select({ university: pavia })))

			(flatMap(lead => pipe(
				items(lead)
				(map(guard(analyze)))
				(map(guard(classify)))
				(map(guard(annotate)))
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
