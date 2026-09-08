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

import { type Event, EventShape, isStale } from "@/events/index.js";
import { type Delta, persist } from "@/_/gear-store/persist.js";
import { execute } from "@/index.core.js";
import { type Feed, pipe, type Task } from "@metreeca/flow";
import { filter, map } from "@metreeca/flow/tasks";


if ( import.meta.main ) {
	execute(dispose);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Retires the stored events that no longer hold.
 *
 * Serves every source, as an event is judged by what it says about itself and by what its own page still serves,
 * never by the workflow that stored it. An event goes only on a positive fact about it, so a check that fails or
 * cannot conclude leaves the event alone for the next run.
 *
 * @returns A promise resolving when every criterion has been run
 */
export async function dispose() {

	// a criterion draws its own candidates and pays its own cost, so each is run on a budget of its own

	await pipe(
		(expiring())
		(filter(isStale))
		(map(event => [event.id, null] satisfies Delta))
		(persist(EventShape))
	);

	await pipe(
		(serving())
		(delisted())
		(map(event => [event.id, null] satisfies Delta))
		(persist(EventShape))
	);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a feed drawing the stored events their own dates place at or past their end.
 *
 * Narrows the events to be judged without deciding on them: the feed may serve events that turn out to hold, but
 * never withholds one that doesn't, so tightening it can only cost work, never leave an event stored forever.
 *
 * @returns A feed carrying the events worth judging on their own state
 */
function expiring(): Feed<Event> {

	throw new Error("to be implemented"); // !!! tbi

}

/**
 * Creates a feed drawing the stored events their source is expected to still serve.
 *
 * @returns A feed carrying the events worth checking against their source
 */
function serving(): Feed<Event> {

	// !!! tbi
	// !!! bound the slice to what a run can probe, and carry the rotation across runs without a stored stamp

	throw new Error("to be implemented"); // !!! tbi

}


/**
 * Creates a task keeping the events their source no longer serves.
 *
 * An event is kept only where its page answers that it is gone. A timeout, a `5xx` or a name that fails to resolve
 * says nothing about the event, so it is dropped from the feed and left as the store holds it.
 *
 * @returns A task drawing the events whose source page reports them gone
 */
function delisted(): Task<Event, Event> {

	throw new Error("to be implemented"); // !!! tbi

}
