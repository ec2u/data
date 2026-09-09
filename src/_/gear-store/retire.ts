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
import type { Awaitables } from "@metreeca/core/async";
import type { IRI } from "@metreeca/core/resource";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toSet } from "@metreeca/flow/sinks";
import { drain } from "@metreeca/flow/tasks";
import { log } from "@metreeca/tape";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a task naming the ids a source has dropped.
 *
 * The incoming feed must name every id the source still accounts for: the stored ids it leaves unnamed are the ones
 * to be retired from the collection. Ids the collection doesn't hold are ignored and each stored id is named at most
 * once, so a run only ever retires. Nothing is named until the incoming feed is exhausted, so no retirement rests on
 * a partial reading of the source.
 *
 * A run that would retire more than `attrition` of the stored ids is read as a broken source rather than as a genuine
 * emptying and refused: the retirements are skipped and the rest of the run is left to land, so a source that comes
 * back sound retires the same ids on the next run. Sources that tolerate no mixed state are served by `atomic`, which
 * fails the whole update instead, leaving the collection as the last sound run left it.
 *
 * @param options The stored ids and the limits governing what a single run may retire
 * @param options.atomic Whether a refused retirement fails the whole update, rather than skipping just the
 * retirements; defaults to `false`
 * @param options.attrition The largest fraction of the currently stored ids a single run may retire, in [0, 1],
 * rounded down to a whole id
 * @param options.existing The ids the collection currently holds
 *
 * @returns A task replacing a feed of the ids a source names with the ids to be retired from the collection
 *
 * @throws {@link !TypeError TypeError} If `attrition` is outside [0, 1]
 *
 * @throws {@link !RangeError RangeError} Under `atomic`, while the feed is consumed, if the run would retire more than
 * `attrition` of the stored ids
 */
export function retire({

	atomic = false,
	attrition,

	existing

}: {

	readonly atomic?: boolean
	readonly attrition: number

	readonly existing: Awaitables<IRI>

}): Task<IRI> {

	const $attrition = assert(attrition, value => value >= 0 && value <= 1,
		`expected attrition rate in [0, 1]`
	);

	return drain(async incoming => {

		const [$existing, $incoming] = await Promise.all([
			pipe((items(existing))(toSet())),
			pipe((items(incoming))(toSet()))
		]);

		const retired = difference([$existing, $incoming]);
		const allowed = Math.floor($existing.size*$attrition);

		const current = $existing.size;
		const dropped = retired.length;

		if ( dropped > allowed ) { // a mass retirement is read as a broken source rather than a genuine emptying

			const action = atomic ? "prevented" : "skipping";
			const percentage = Math.round($attrition*100);

			const message = `${action} mass retirement of more than <${percentage}%> of <${current}> current items`;

			if ( atomic ) { // a throw aborts the whole update, leaving the collection as the last sound run left it

				throw new RangeError(message);

			} else { // a partial update only skips the retirements, leaving the other writes to land

				logger.warn(message);

				return [];

			}

		} else {

			logger.info`retiring <${retired.length}> of <${current}> current items`;

			return retired;

		}

	});

}
