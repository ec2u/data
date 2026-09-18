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

import { matches, merge } from "@ec2u/data-loader/units/_index.js";
import { _units } from "@ec2u/data-loader/units/store.js";
import { analyze } from "@ec2u/data-loader/units/tasks/analyze/analyze.js";
import { annotate } from "@ec2u/data-loader/units/tasks/analyze/annotate.js";
import { classify } from "@ec2u/data-loader/units/tasks/analyze/classify.js";
import { pavia } from "@ec2u/data-loader/universities/index.core.js";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { each } from "@metreeca/flow/sinks";
import { flat, fork, map } from "@metreeca/flow/tasks";
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


const Concurrency = 32;


const logger = log(import.meta.url);


if ( import.meta.main ) {
	execute();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default async function execute(): Promise<number> {

	return time(async () => pipe(
		// (items(units.select({ analyzed: Date.now()-stale }))) // !!!

		(items(await _units.select({ university: pavia.id })))

		(map(lead => pipe(
			items(lead)
			(step(analyze))
			(step(classify))
			(step(annotate))
			(map(item => merge(lead, {

				...item,

				updated: matches(lead, item) ? lead.updated : Date.now(),
				analyzed: Date.now()

			})))
		)))

		(fork(Concurrency, flat()))
		(each(_units.insert))
	), (count, elapsed) => {
		logger.info`processed <${count}> units in <${report(elapsed)}> ms`;
	});

}


/**
 * States the task applying a processing step to every unit, dropping the ones it fails on.
 */
function step<V, R>(task: (unit: V) => Promise<R>): Task<V, R> {
	return feed => pipe(feed
		(map(async unit => items(await log(task)(unit) ?? [])))
		(flat())
	);
}
