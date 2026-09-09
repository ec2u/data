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

import { assert } from "@metreeca/core";
import { difference } from "@metreeca/core/arrays";
import type { IRI } from "@metreeca/core/resource";
import { type Feed, pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toSet } from "@metreeca/flow/sinks";
import { drain } from "@metreeca/flow/tasks";
import { log } from "@metreeca/tape";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a task turning a source scan into the retirements it warrants.
 *
 * The task weighs two feeds against each other. The incoming feed carries a scan naming every resource identifier the
 * source still accounts for, while `existing` names the identifiers currently in place: whatever the scan leaves
 * unnamed among them is named for retirement. What comes out is always part of `existing`, each identifier at most
 * once, and nothing comes out before the scan runs dry, so no retirement rests on a partial reading.
 *
 * A scan that comes back short more often means a broken source than a genuine emptying, so a retirement that would
 * leave in place less than `survival` of the existing identifiers is refused. The refusal by default skips just the
 * retirements and lets the rest of the update land, so a source restored to health retires the same identifiers on
 * its next scan. Sources that tolerate no mixed state are served by `atomic`, which fails the whole update instead.
 *
 * A `survival` of `0` lifts the safeguard altogether, letting a scan retire everything, while `1` refuses every
 * retirement, making the update append-only.
 *
 * @param options The existing resource identifiers and the limits governing what a single run may retire
 * @param options.atomic Whether a refused retirement fails the whole update, rather than skipping just the
 * retirements; defaults to `false`
 * @param options.survival The smallest fraction of the existing identifiers a single run must leave in place, in
 * [0, 1], rounded up to a whole identifier
 * @param options.existing A feed of the resource identifiers currently in place
 *
 * @returns A task replacing a feed of the resource identifiers a source names with the identifiers to be retired
 *
 * @throws {@link !TypeError TypeError} If `survival` is outside [0, 1]
 *
 * @throws {@link !RangeError RangeError} Under `atomic`, while the feed is consumed, if the run would leave in place
 * less than `survival` of the existing identifiers
 */
export function retire({

	atomic = false,
	survival,

	existing

}: {

	readonly atomic?: boolean
	readonly survival: number

	readonly existing: Feed<IRI>

}): Task<IRI> {

	const $survival = assert(survival, value => value >= 0 && value <= 1,
		`expected survival rate in [0, 1]`
	);

	return drain(async incoming => {

		const [$existing, $incoming] = await Promise.all([
			existing(toSet()),
			pipe((items(incoming))(toSet()))
		]);

		const retired = difference([$existing, $incoming]);

		const current = $existing.size;
		const dropped = retired.length;

		const minimum = current*$survival;
		const holding = current-dropped;

		if ( holding < minimum ) { // a mass retirement is read as a broken source rather than a genuine emptying

			const action = atomic ? "prevented" : "skipping";
			const share = Math.round($survival*100);

			const message = `${action} mass retirement leaving less than <${share}%> of <${current}> current items`;

			if ( atomic ) { // a throw aborts the whole update, leaving the collection as the last sound run left it

				throw new RangeError(message);

			} else { // a partial update only skips the retirements, leaving the other writes to land

				logger.warn(message);

				return [];

			}

		} else {

			logger.info`retiring <${dropped}> of <${current}> current items`;

			return retired;

		}

	});

}
