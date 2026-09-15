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

import { sleep } from "@metreeca/core/async";
import { type Feed, pipe } from "@metreeca/flow";
import { inlet, items } from "@metreeca/flow/feeds";
import { toArray, toSet } from "@metreeca/flow/sinks";
import { filter, map, take } from "@metreeca/flow/tasks";
import { describe, expect, it, vi } from "vitest";
import { when } from "./when.js";


class TaskError extends Error {}


const even = (value: number): boolean => value%2 === 0;


/**
 * Creates a feed yielding the given items, recording each as it is drawn.
 */
function tracked(drawn: number[], values: readonly number[]): Feed<number> {
	return items((async function* () {
		for (const value of values) {
			drawn.push(value);
			yield value;
		}
	})());
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("when", () => {

	it("hands the items meeting the condition to the task", async () => {

		expect(await pipe(
			(items([1, 2, 3, 4]))
			(when(even, map(value => value*10)))
			(toSet())
		)).toEqual(new Set([1, 3, 20, 40]));

	});

	it("leaves the other items as they were drawn", async () => {

		expect(await pipe(
			(items([1, 2, 3]))
			(when(even, filter(() => false)))
			(toSet())
		)).toEqual(new Set([1, 3]));

	});

	it("hands the other items to the second task", async () => {

		expect(await pipe(
			(items([1, 2, 3, 4]))
			(when(even, map(value => `${value} even`), map(value => `${value} odd`)))
			(toSet())
		)).toEqual(new Set(["2 even", "4 even", "1 odd", "3 odd"]));

	});

	it("routes an item to one reading alone", async () => {

		expect(await pipe(
			(items([1, 2, 3, 4]))
			(when(even, map(value => `${value} even`), map(value => `${value} odd`)))
			(toSet())
		)).not.toContain("2 odd");

	});

	it("drops the items a task withholds", async () => {

		expect(await pipe(
			(items([1, 2, 3, 4]))
			(when(even, filter(value => value > 2), filter(() => false)))
			(toSet())
		)).toEqual(new Set([4]));

	});

	it("reports nothing for a feed carrying nothing", async () => {

		expect(await pipe(
			(items<number>([]))
			(when(even, map(value => value*10)))
			(toSet())
		)).toEqual(new Set());

	});

	it("keeps the order of the items of each reading", async () => {

		const values = await pipe(
			(items([1, 2, 3, 4, 5, 6]))
			(when(even, map(value => value*10)))
			(toArray())
		);

		expect(values.filter(value => value < 10)).toEqual([1, 3, 5]);
		expect(values.filter(value => value >= 10)).toEqual([20, 40, 60]);

	});

	it("draws each item once, however the condition answers", async () => {

		const drawn: number[] = [];

		const values = await pipe(
			(tracked(drawn, [1, 2, 3, 4]))
			(when(even, map(value => value*10)))
			(toSet())
		);

		expect(drawn).toEqual([1, 2, 3, 4]);
		expect(values).toEqual(new Set([1, 3, 20, 40]));

	});

	it("emits items as they are drawn", async () => {

		const count = { next: 0 };

		const values = await pipe( // an infinite feed completes, as the quota downstream is met before it runs dry
			(inlet(() => ++count.next))
			(when(even, map(value => -value)))
			(take(4))
			(toSet())
		);

		expect(values).toEqual(new Set([1, -2, 3, -4]));

	});

	it("weighs the condition once for each reading", async () => {

		const condition = vi.fn(even);

		await pipe(
			(items([1, 2]))
			(when(condition, map(value => value)))
			(toSet())
		);

		expect(condition).toHaveBeenCalledTimes(4);

	});

	it("hands each task a feed of its own", async () => {

		expect(await pipe(
			(items([1, 2, 3, 4, 5, 6]))
			(when(even, take(2), take(2)))
			(toSet())
		)).toEqual(new Set([1, 2, 3, 4]));

	});

	it("lets a task run dry without holding back the other", async () => {

		expect(await pipe(
			(items([1, 2, 3, 4]))
			(when(even, take(1), map(value => value*100)))
			(toSet())
		)).toEqual(new Set([2, 100, 300]));

	});

	it("interleaves the items of the two readings", async () => {

		const values = await pipe(
			(items([1, 2]))
			(when(even, map(async value => {
				await sleep(20);
				return value*10;
			}), map(value => value*100)))
			(toArray())
		);

		expect(values).toEqual([100, 20]);

	});

	it("reports a condition failure", async () => {

		await expect(pipe(
			(items([1, 2, 3]))
			(when(value => {

				if ( value === 2 ) { throw new TaskError("condition failed"); }

				return true;

			}, map(value => value)))
			(toSet())
		)).rejects.toThrow(TaskError);

	});

	it("reports a task failure", async () => {

		await expect(pipe(
			(items([1, 2, 3]))
			(when(even, map(() => { throw new TaskError("task failed"); })))
			(toSet())
		)).rejects.toThrow(TaskError);

	});

});
