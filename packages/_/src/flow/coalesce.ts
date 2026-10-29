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

/**
 * Per-item fallback between alternative tasks.
 *
 * Provides the {@link coalesce} task, which reads each item through the first of several alternative tasks yielding
 * anything for it, so that a pipe falls back from a preferred reading to the next one item by item, without stepping
 * out of the feed to handle single items by hand and without losing track of the item a reading came up empty on.
 *
 * ```typescript
 * import { coalesce } from "@metreeca/work/flow/coalesce.js";
 *
 * pipe(
 *   (items(urls))
 *   (fetch())
 *   (html())
 *   (coalesce(
 *     trees => trees(focus())(untag()),
 *     trees => trees(unwrap())(trim(map(values => values.find(isEvent))))(map(render))
 *   ))
 * );
 * ```
 *
 * Incubated here until it settles, then due to move to `@metreeca/flow`.
 *
 * @module
 */

import type { Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";


/**
 * Creates a task reading each item through the first alternative yielding anything for it.
 *
 * Each item is handed, as a feed of its own, to the alternatives in turn: the items yielded by the first alternative
 * yielding any are emitted, and the alternatives after it are not tried on that item. An item no alternative yields
 * anything for contributes nothing to the feed, so the output is not aligned one to one with the input.
 *
 * Items are read one at a time, so the output keeps source order: everything yielded for an item is emitted before the
 * next item is drawn from the source, however long each alternative takes to settle.
 *
 * > [!NOTE]
 * >
 * > - **Incremental**: items are emitted as soon as the chosen alternative yields them, so endless sources are
 * >   processed for as long as the feed is consumed.
 * > - **Streaming**: one item is read at a time and none is retained once its alternatives have settled.
 * > - **Stateless**: each item is read on its own, so the result doesn't depend on how the feed is split across nested
 * >   feeds or runs, whatever state the alternatives carry within a single item.
 *
 * > [!CAUTION]
 * >
 * > Alternatives are invoked afresh on every item and handed that item alone, so any state a task sets up when invoked
 * > covers a single item. A quota, a deduplication or an ordering never spans the whole feed as it would elsewhere in
 * > the pipe: place it upstream or downstream of `coalesce` whenever it has to cover more than one item.
 *
 * > [!NOTE]
 * >
 * > A failing alternative fails the feed rather than handing the item over to the next one. Only an alternative that
 * > runs dry without yielding anything gives way to the alternatives listed after it.
 *
 * > [!NOTE]
 * >
 * > The source and the alternative in progress are closed when the feed is exhausted, fails or is closed early.
 *
 * @typeParam V The type of items drawn from the feed
 * @typeParam R The type of items yielded by the alternatives
 *
 * @param alternatives The tasks each item is read through, in order of preference; handing over none yields an empty
 *   feed, though the source is still drained to its end and any work upstream still runs
 *
 * @returns A task yielding, for each item in source order, the items yielded by the first alternative yielding any
 *
 * @throws {@link !Error Error} While the feed is consumed, if the source feed or an alternative fails
 *
 * @example
 *
 * ```typescript
 * await pipe(
 *   (items([1, 2, 3, 4]))
 *   (coalesce(filter(n => n%2 === 0), trim(map(n => n > 2 ? -n : undefined))))
 *   (toArray())
 * );  // [2, -3, 4]
 * ```
 */
export function coalesce<V, R>(...alternatives: readonly Task<V, R>[]): Task<V, R> {

	return source => items((async function* () {

		for await (const item of source) {
			yield* read(item, alternatives);
		}

	})());


	async function* read(item: V, [alternative, ...fallbacks]: readonly Task<V, R>[]): AsyncGenerator<R> {

		if ( alternative !== undefined ) {

			const iterator = alternative(items([item]))[Symbol.asyncIterator]();

			try {

				const first = await iterator.next();

				if ( first.done ) { // a dry alternative gives way to the next one

					yield* read(item, fallbacks);

				} else {

					yield first.value;
					yield* { [Symbol.asyncIterator]: () => iterator };

				}

			} finally {

				await iterator.return?.();

			}

		}

	}

}
