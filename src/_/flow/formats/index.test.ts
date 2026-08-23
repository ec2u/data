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
 * Shared parsing task test fixtures.
 *
 * @module
 */

import { describe, expect, it } from "vitest";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * A failure reported by a source, told apart from failures reported by the task under test.
 */
export class SourceError extends Error {}


/**
 * Creates a source reporting the given chunks.
 */
export async function* chunks(...values: readonly (string | Uint8Array)[]): AsyncIterable<string | Uint8Array> {
	yield* values;
}

/**
 * Drains a stream into an array.
 */
export async function collect<V>(items: AsyncIterable<V>): Promise<readonly V[]> {

	const collected: V[] = [];

	for await ( const item of items ) { collected.push(item) } // draining a stream has no functional equivalent

	return collected;

}

/**
 * Creates a counting source reporting how far it was pulled and whether it was released.
 *
 * @param count The number of items to be reported
 * @param item The text of the item at a given index
 * @param options The framing options
 * @param options.head The text reported before the items
 * @param options.tail The text reported after the items
 */
export function source(count: number, item: (index: number) => string, {

	head,
	tail

}: {

	readonly head?: string
	readonly tail?: string

} = {}) {

	const state = { pulled: 0, closed: false }; // records the effects the task has on the source

	async function* generate(): AsyncIterable<string> {

		yield* head === undefined ? [] : [head];

		try {

			for ( const index of Array.from({ length: count }, (_, i) => i) ) {

				state.pulled = index + 1;

				yield item(index);

			}

		} finally {

			state.closed = true;

		}

		yield* tail === undefined ? [] : [tail];

	}

	return {

		chunks: generate(),

		pulled: () => state.pulled,
		closed: () => state.closed

	};

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("source", () => {

	it("wraps the items in the head and tail chunks", async () => {

		const counting = source(2, index => `<${ index }>`, { head: "[", tail: "]" });

		expect(await collect(counting.chunks)).toEqual(["[", "<0>", "<1>", "]"]);

	});

	it("counts the items pulled from the source", async () => {

		const counting = source(3, index => `<${ index }>`);

		const items = counting.chunks[Symbol.asyncIterator]();

		await items.next();
		await items.next();

		expect(counting.pulled()).toBe(2);

	});

	it("reports the source as released when the consumer stops early", async () => {

		const counting = source(3, index => `<${ index }>`);

		const items = counting.chunks[Symbol.asyncIterator]();

		await items.next();
		await items.return?.();

		expect(counting.closed()).toBeTruthy();

	});

});
