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
import { items } from "@metreeca/flow/feeds";


export function when<V>(
	test: (value: NoInfer<V>) => boolean,
	pass: Task<NoInfer<V>>
): Task<V>

export function when<V, R>(
	test: (value: NoInfer<V>) => boolean,
	pass: Task<NoInfer<V>, R>,
	fail: Task<NoInfer<V>, R>
): Task<V, R>

export function when<V>(
	test: (value: V) => boolean,
	pass: Task<V>,
	fail?: Task<V>
): Task<V> {

	return source => items((async function* () {

		type Reading = { // one side of the split, drawn by its task through a cursor of its own

			pending: readonly V[]; // the items routed here while the reading wasn't drawing, oldest first
			live: boolean; // cleared as the source runs dry or the reading stops drawing, dropping the items due to it

		};

		type Output = AsyncIterator<V, void, undefined>; // the feed reported by one task, drawn for its items
		type Event = { readonly output: Output; readonly result: IteratorResult<V, void> };


		// the single reader of the source: wrapping it in a generator serialises the draws issued by the readings

		const reader = (async function* () { yield* source; })();

		const passing: Reading = { pending: [], live: true };
		const failing: Reading = { pending: [], live: true };

		// the outputs of the two tasks are raced, so that either reports as soon as it has an item

		const outputs = [
			pass(items(cursor(passing))),
			fail ? fail(items(cursor(failing))) : items(cursor(failing))
		].map<Output>(feed => feed[Symbol.asyncIterator]());

		const polls = new Map(outputs.map(output => [output, poll(output)]));


		try {

			while ( polls.size > 0 ) {

				const { output, result } = await Promise.race(polls.values());

				if ( result.done ) { // the output ran dry: drop it from the race

					polls.delete(output);

				} else { // put the output back to work before yielding, so it keeps drawing meanwhile

					polls.set(output, poll(output));

					yield result.value;

				}

			}

		} finally { // on failure or early termination as well

			await Promise.allSettled([
				...Array.from(polls.keys(), async output => output.return?.()), // close the outputs and
				...polls.values() // suppress late failures from their abandoned polls
			]);

			await Promise.allSettled([reader.return()]); // close the source, now that no reading is drawing from it

		}


		function poll(output: Output): Promise<Event> {

			const event = output.next().then(result => ({ output, result }));

			event.catch(() => {}); // suppress unhandled rejection reports while the event waits its turn in the race

			return event;

		}

		function deliver(reading: Reading, value: V): void {

			if ( reading.live ) { // the items due to a reading that stopped drawing are dropped

				reading.pending = [...reading.pending, value];

			}

		}

		function cursor(reading: Reading): AsyncIterableIterator<V> { // one reading's view of the routed items

			const iterator: AsyncIterableIterator<V> = {

				next: async () => {

					const [value, ...rest] = reading.pending;

					if ( reading.pending.length > 0 ) { // an item routed here, possibly by the other reading

						reading.pending = rest;

						return { done: false, value };

					} else if ( !reading.live ) {

						return { done: true, value: undefined };

					} else { // draw an item and route it, then look again: it may be due to the other reading

						const item = await reader.next();

						if ( item.done ) {

							reading.live = false;

						} else {

							deliver(test(item.value) ? passing : failing, item.value);

						}

						return iterator.next();

					}

				},

				return: async () => {

					reading.live = false; // from here on the items due to this reading are dropped
					reading.pending = [];

					return { done: true, value: undefined };

				},

				[Symbol.asyncIterator]: () => iterator

			};

			return iterator;

		}

	})());

}
