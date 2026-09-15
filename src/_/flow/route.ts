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
import { join } from "@metreeca/flow/tasks";


export function route<V>(
	condition: (value: NoInfer<V>) => boolean,
	pass: Task<NoInfer<V>>
): Task<V>

export function route<V, R>(
	condition: (value: NoInfer<V>) => boolean,
	pass: Task<NoInfer<V>, R>,
	fail: Task<NoInfer<V>, R>
): Task<V, R>

export function route<V>(
	condition: (value: V) => boolean,
	pass: Task<V>,
	fail?: Task<V>
): Task<V> {

	return source => items((async function* () {

		type Demand = { // the draw a reading is waiting on, settled as its next item is routed

			readonly resolve: (result: IteratorResult<V, void>) => void;
			readonly reject: (reason: unknown) => void;

		};

		type Node = { readonly value: V; next: Node | undefined } // an item routed to a reading not drawing at the time

		type Reading = {

			head: Node | undefined; // the oldest item routed here and not yet drawn
			tail: Node | undefined;

			demand: Demand | undefined; // the draw waiting for the next item, at most one per reading
			live: boolean; // cleared as the reading stops drawing, from then on dropping the items due to it

		};


		// the single reader of the source: wrapping it in a generator serialises the draws issued by the readings

		const reader = (async function* () { yield* source; })();

		const passing: Reading = { head: undefined, tail: undefined, demand: undefined, live: true };
		const failing: Reading = { head: undefined, tail: undefined, demand: undefined, live: true };

		// the routing loop runs while a reading is waiting: no item is drawn beyond what the readings ask for

		const state: {

			failure: { readonly reason: unknown } | undefined; // the failure reported by the source or the condition
			ended: boolean;
			routing: boolean;

		} = { failure: undefined, ended: false, routing: false };


		const failed = items(cursor(failing));

		try {

			yield* items([pass(items(cursor(passing))), fail ? fail(failed) : failed])(join());

		} finally { // on failure or early termination as well

			await Promise.allSettled([reader.return()]); // close the source, now that no reading is drawing from it

		}


		async function serve(): Promise<void> { // a single loop serves both readings, however they interleave

			if ( !state.routing ) {

				state.routing = true;

				try {

					while ( !state.ended && (passing.demand || failing.demand) ) {

						const item = await reader.next();

						if ( item.done ) {

							close();

						} else {

							deliver(condition(item.value) ? passing : failing, item.value);

						}

					}

				} catch ( reason ) {

					state.failure = { reason };

					close();

				} finally {

					state.routing = false;

				}

			}

		}

		function deliver(reading: Reading, value: V): void {

			if ( reading.live ) { // the items due to a reading that stopped drawing are dropped

				const demand = reading.demand;

				if ( demand ) {

					reading.demand = undefined;

					demand.resolve({ done: false, value });

				} else {

					const node: Node = { value, next: undefined };

					if ( reading.tail ) { reading.tail.next = node; } else { reading.head = node; }

					reading.tail = node;

				}

			}

		}

		function close(): void {

			state.ended = true;

			settle(passing);
			settle(failing);

		}

		function settle(reading: Reading): void {

			const demand = reading.demand;

			if ( demand ) {

				reading.demand = undefined;

				if ( state.failure ) {

					demand.reject(state.failure.reason);

				} else {

					demand.resolve({ done: true, value: undefined });

				}

			}

		}

		function cursor(reading: Reading): AsyncIterableIterator<V> { // one reading's view of the routed items

			const iterator: AsyncIterableIterator<V> = {

				next: async () => {

					const head = reading.head;

					if ( head ) { // an item routed here while the reading wasn't drawing

						reading.head = head.next;

						if ( !head.next ) { reading.tail = undefined; }

						return { done: false, value: head.value };

					} else if ( state.failure ) {

						throw state.failure.reason;

					} else if ( state.ended || !reading.live ) {

						return { done: true, value: undefined };

					} else {

						return new Promise<IteratorResult<V, void>>((resolve, reject) => {

							reading.demand = { resolve, reject };

							void serve();

						});

					}

				},

				return: async () => {

					reading.live = false; // from here on the items due to this reading are dropped

					reading.head = undefined;
					reading.tail = undefined;

					settle(reading);

					return { done: true, value: undefined };

				},

				[Symbol.asyncIterator]: () => iterator

			};

			return iterator;

		}

	})());

}
