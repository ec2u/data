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

import { createStore } from "@/_/gear-store/index.js";
import { EventShape } from "@/events/index.js";
import { immutable } from "@metreeca/core/structures";
import type { Sink } from "@metreeca/flow";
import { reduce } from "@metreeca/flow/sinks";
import { service } from "@metreeca/gear";
import type { Reference } from "@metreeca/qest";
import type { Resource } from "@metreeca/qest/resource";
import { log, report } from "@metreeca/tape";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Target state of a single event.
 *
 * A workflow settles on one of these for every event it looks at, naming the state to store or, with `null`, the
 * removal. Whether it gathers events or retires them the statement is the same, so all workflows close on the same
 * sink. `T` carries a workflow's own event type through to the store, so a state is not widened to a bare resource on
 * the way.
 *
 * @typeParam T The type of the states to be stored
 */
export type Delta<T extends Resource = Resource> = [

	/**
	 * The event concerned.
	 */
	entry: Reference,

	/**
	 * The state the event is to be stored with, or `null` for an event to be removed.
	 */
	state: null | T

]

/**
 * Counts of what a run did to the events it drew.
 *
 * Every event falls under exactly one count, so the three add up to the number of deltas drawn and a run went cleanly
 * exactly when `failed` is zero.
 */
export interface Tally {

	/**
	 * The number of events stored, whether afresh or over a state already held.
	 */
	readonly stored: number;

	/**
	 * The number of events removed, whether or not the store held them.
	 */
	readonly removed: number;

	/**
	 * The number of events a failed write left exactly as the store already held them, to be reconsidered by the next
	 * run.
	 */
	readonly failed: number;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a sink storing the events a workflow claims.
 *
 * Each delta is committed on its own, so a run interrupted at any point leaves behind exactly the events it got to and
 * the next run is free to carry on. A write that fails is logged and counted, leaving the event as it was and the feed
 * running: a single unusable event, or a single hostile response from the store, costs one event rather than the run.
 *
 * A run that fails every write it attempts is a broken deployment rather than a run of bad luck, and rejects so that
 * the scheduler sees the attempt fail and retries it.
 *
 * @returns A sink storing a feed of deltas and resolving to a tally of what it did
 *
 * @throws {@link !Error Error} While the feed is consumed, if every attempted write fails
 */
export function persist(): Sink<Delta, Tally> {

	const store = service(createStore);

	return async feed => {

		const tally = await feed(reduce(async (tally, [entry, state]) => {

			try {

				if ( state === null ) {

					await store.remove({ entry, shape: EventShape });

					logger.info`removed event <${entry}>`;

					tally.removed++;

				} else {

					await store.insert({ entry, shape: EventShape, state });

					logger.info`stored event <${entry}>`;

					tally.stored++;

				}

			} catch ( error ) {

				logger.warning`unable to write event <${entry}>: ${report(error)}`;

				tally.failed++;

			}

			return tally;

		}, {

			stored: 0,
			removed: 0,
			failed: 0

		}));

		if ( tally.failed > 0 && tally.stored+tally.removed === 0 ) {
			throw new Error(`rejected every write <${tally.failed}>`);
		}

		return immutable(tally);

	};

}
