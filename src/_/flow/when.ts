/*
 * Copyright © 2026 Metreeca srl
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

import { type Task } from "@metreeca/flow";
import { filter, tee } from "@metreeca/flow/tasks";


/**
 * Conditional feed routing.
 *
 * Provides a task handing the items meeting a condition to one task and the others to another, so a stage applying to
 * part of a feed is stated where it belongs rather than as two pipes weighing the same condition from either side.
 *
 * @module
 */

/**
 * Creates a task routing the items on a condition.
 *
 * The items meeting the condition are handed to one task and the others are left as they are, so a stage applying to
 * part of a feed is stated where it belongs rather than as two pipes weighing the same condition from either side.
 *
 * @typeParam V The type of items drawn from the feed
 *
 * @param condition The condition weighed on each item
 * @param pass The task handed the items meeting `condition`
 *
 * @returns A task yielding what `pass` reports for the items meeting `condition`, together with the other items as
 *     they were drawn
 */
export function when<V>(
	condition: (value: NoInfer<V>) => boolean,
	pass: Task<NoInfer<V>>
): Task<V>

/**
 * Creates a task routing the items on a condition.
 *
 * The items meeting the condition are handed to one task and the others to another, so a feed splitting on a
 * condition is stated as the two readings it takes rather than as two pipes weighing the same condition from either
 * side.
 *
 * @typeParam V The type of items drawn from the feed
 * @typeParam R The type of items both tasks report
 *
 * @param condition The condition weighed on each item
 * @param pass The task handed the items meeting `condition`
 * @param fail The task handed the items failing it
 *
 * @returns A task yielding what `pass` and `fail` report, as they report it
 */
export function when<V, R>(
	condition: (value: NoInfer<V>) => boolean,
	pass: Task<NoInfer<V>, R>,
	fail: Task<NoInfer<V>, R>
): Task<V, R>

/**
 * @remarks
 *
 * Each task is handed the share of the items it is due as a feed of its own, so state it initialises on invocation
 * decides on that share alone; both are drawn in lockstep, one item on offer at a time, and neither holds the other
 * back once it runs dry.
 *
 * > [!CAUTION]
 * >
 * > The condition is weighed once for each reading, and so twice on every item: it is expected to answer the same way
 * > each time and to cost little enough to bear it. Work worth doing once belongs upstream, in a stage stating its
 * > outcome on the item.
 *
 * > [!NOTE]
 * >
 * > - **Incremental**: items are emitted as the tasks report them, so the reported feed runs dry as the feed drawn
 * >   from and both tasks do.
 * > - **Streaming**: one item is on offer at a time and none is retained, whatever the tasks retain.
 * > - **Stateless**: the routing carries no state across items, whatever the tasks carry.
 *
 * > [!WARNING]
 * >
 * > Output order is not preserved: the items of the two tasks interleave and overtake each other according to how
 * > long each takes, though the items of each keep their own order among themselves.
 *
 * @see {@link tee}
 */
export function when<V>(condition: (value: V) => boolean, pass: Task<V>, fail: Task<V> = feed => feed): Task<V> {

	return tee(
		feed => pass(feed(filter(condition))),
		feed => fail(feed(filter(value => !condition(value))))
	);

}
