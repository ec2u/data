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

import { createStore } from "@/_/tide-store/index.js";
import type { ResourceShape } from "@metreeca/blue/resource";
import type { Lazy } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import type { Sink } from "@metreeca/flow";
import { reduce } from "@metreeca/flow/sinks";
import { service } from "@metreeca/gear";
import type { StoreClient } from "@metreeca/keep";
import type { Reference, Resource } from "@metreeca/qest/resource";
import { log, report, time } from "@metreeca/tape";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Target state of a single resource.
 *
 * A workflow settles on one of these for every resource it looks at, naming the state to store or, with `null`, the
 * removal. Every delta names the shape it is stated under, so one feed carries resources of as many kinds as a
 * workflow states and they all reach the store together. Whether it gathers resources or retires them the statement
 * is the same, so all workflows close on the same sink. `T` carries a workflow's own state type through to the store,
 * so a state is not widened on the way.
 *
 * @typeParam T The type of the states to be stored
 */
export type Delta<T extends Resource = Resource> = readonly [

	/**
	 * The resource concerned.
	 */
	entry: Reference,

	/**
	 * The shape the resource is stated under.
	 */
	shape: Lazy<ResourceShape>,

	/**
	 * The state the resource is to be stored with, or `null` for a resource to be removed.
	 */
	state: null | T

]

/**
 * Counts of what a run did to the resources it drew.
 *
 * Every resource falls under exactly one count, so the three add up to the number of deltas drawn and a run went
 * cleanly exactly when `reject` is zero.
 */
export interface Tally {

	/**
	 * The number of resources stored, whether afresh or over a state already held.
	 */
	readonly insert: number;

	/**
	 * The number of resources removed, whether or not the store held them.
	 */
	readonly remove: number;

	/**
	 * The number of resources a failed write left exactly as the store already held them.
	 */
	readonly reject: number;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a sink storing the resources a workflow claims.
 *
 * Each delta is committed on its own, so a run interrupted at any point leaves behind exactly the resources it got to
 * and the next run is free to carry on. A write that fails is logged and counted, leaving the resource as it was and
 * the feed running: a single unusable resource, or a single hostile response from the store, costs one resource rather
 * than the run.
 *
 * A rejected state is a broken run rather than a bad resource: a shape the states don't satisfy would otherwise fail
 * every write alike and hand back a clean run that stored nothing, so the failure is propagated and the scheduler sees
 * the attempt fail and retries it.
 *
 * Sources that tolerate no mixed state are served by `atomic`, which trades all that for all-or-nothing: the whole
 * feed is drawn inside a single store transaction, and the first failing write leaves the store exactly as it was.
 *
 * @param options Options governing how the deltas are committed
 * @param options.atomic Whether the deltas are committed as a single transaction, dropping them all as soon as one
 * write fails; defaults to `false`, committing each delta on its own and absorbing individual failures
 *
 * @returns A sink storing a feed of deltas and resolving to a tally of what it did
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if the store rejects a state as invalid
 *
 * @throws {@link !Error Error} Under `atomic`, while the feed is consumed, if any write fails, with nothing committed
 */
export function persist({

	atomic = false

}: {

	readonly atomic?: boolean

} = {}): Sink<Delta, Tally> {

	const store = service(createStore);


	return async feed => time(async () => immutable(atomic
		? await store.execute(client => feed(collect(client)))
		: await feed(collect(store))

	), ({ insert, remove, reject }, elapsed) => {

		const total = insert+remove+reject;

		const resources = total === 1 ? "resource" : "resources";
		const counts = `insert <${report(insert)}> | remove <${report(remove)}> | reject <${report(reject)}>`;

		logger.info`persisted <${report(total)}> ${resources} in <${report(elapsed)}> ms | ${counts}`;

	});


	function collect(client: StoreClient): Sink<Delta, Tally> {
		return reduce(async (tally, [entry, shape, state]) => {

			try {

				if ( state === null ) {

					await client.remove({ entry, shape });

					logger.info`removed resource <${entry}>`;

					return { ...tally, remove: tally.remove+1 };

				} else {

					await client.insert({ entry, shape, state });

					logger.info`inserted resource <${entry}>`;

					return { ...tally, insert: tally.insert+1 };

				}

			} catch ( error ) {

				// a transaction commits as one, and a logic error condemns every write alike: either ends the run,
				// while a lone hostile response costs just its own resource and leaves the feed running

				if ( atomic || error instanceof RangeError ) {

					throw error;

				} else {

					logger.warning`unable to mutate resource <${entry}> (${report(error)})`;

					return { ...tally, reject: tally.reject+1 };

				}

			}

		}, {

			insert: 0,
			remove: 0,
			reject: 0

		});
	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a delta for a resource.
 *
 * A `null` state states the removal of the resource, so a workflow that gathers resources and one that retires them
 * both close on the same call.
 *
 * @typeParam T The type of the state to be stored
 *
 * @param entry The resource concerned
 * @param shape The shape the resource is stated under
 * @param state The state the resource is to be stored with; `null` to state its removal
 *
 * @returns An immutable {@link Delta} pairing `entry` and `shape` with `state`
 */
export function delta<T extends Resource>(entry: Reference, shape: Lazy<ResourceShape>, state: null | T): Delta<T> {

	return Object.freeze([entry, shape, state]);

}
