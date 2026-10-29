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
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { distinct, filter, flat, map, take, trim } from "@metreeca/flow/tasks";
import { describe, expect, it, vi } from "vitest";
import { coalesce } from "./coalesce.js";


class TaskError extends Error {}


/**
 * Creates a feed yielding the given items, recording each as it is drawn and whether the feed was closed.
 */
function tracked(drawn: number[], closed: { value: boolean }, values: readonly number[]): Feed<number> {
	return items((async function* () {
		try {
			for (const value of values) {
				drawn.push(value);
				yield value;
			}
		} finally {
			closed.value = true;
		}
	})());
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("coalesce", () => {

	describe("alternatives", () => {

		it("emits what the first alternative yields", async () => {

			expect(await pipe(
				(items([1, 2, 3]))
				(coalesce(map(value => value*10), map(value => -value)))
				(toArray())
			)).toEqual([10, 20, 30]);

		});

		it("falls back to the next alternative on items the earlier ones yield nothing for", async () => {

			expect(await pipe(
				(items([1, 2, 3, 4]))
				(coalesce(filter(value => value%2 === 0), map(value => -value)))
				(toArray())
			)).toEqual([-1, 2, -3, 4]);

		});

		it("tries every alternative in order of preference", async () => {

			expect(await pipe(
				(items([1, 2, 3, 6]))
				(coalesce(
					trim(map(value => value%6 === 0 ? `${value} sixfold` : undefined)),
					trim(map(value => value%2 === 0 ? `${value} even` : undefined)),
					map(value => `${value} other`)
				))
				(toArray())
			)).toEqual(["1 other", "2 even", "3 other", "6 sixfold"]);

		});

		it("drops items no alternative yields anything for", async () => {

			expect(await pipe(
				(items([1, 2, 3, 4]))
				(coalesce(filter(value => value%2 === 0), filter(value => value > 3)))
				(toArray())
			)).toEqual([2, 4]);

		});

		it("emits every item the chosen alternative yields", async () => {

			expect(await pipe(
				(items([1, 2]))
				(coalesce(flat(map(value => [value, value*10]))))
				(toArray())
			)).toEqual([1, 10, 2, 20]);

		});

		it("doesn't try the alternatives after the one yielding", async () => {

			const fallback = vi.fn((value: number) => -value);

			await pipe(
				(items([1, 2, 3]))
				(coalesce(map(value => value), map(fallback)))
				(toArray())
			);

			expect(fallback).not.toHaveBeenCalled();

		});

		it("yields nothing without alternatives", async () => {

			expect(await pipe(
				(items([1, 2, 3]))
				(coalesce<number, number>())
				(toArray())
			)).toEqual([]);

		});

	});

	describe("ordering", () => {

		it("keeps source order whatever each alternative takes", async () => {

			expect(await pipe(
				(items([30, 10, 20]))
				(coalesce(
					filter(async value => value !== 10 && (await sleep(value), true)),
					map(async value => (await sleep(0), -value))
				))
				(toArray())
			)).toEqual([30, -10, 20]);

		});

	});

	describe("state", () => {

		it("invokes alternatives afresh on every item", async () => {

			expect(await pipe(
				(items([1, 2, 3]))
				(coalesce(take<number>(1)))
				(toArray())
			)).toEqual([1, 2, 3]);

		});

		it("confines alternative state to a single item", async () => {

			expect(await pipe(
				(items([1, 1, 2]))
				(coalesce(distinct<number, number>()))
				(toArray())
			)).toEqual([1, 1, 2]);

		});

	});

	describe("failures", () => {

		it("fails the feed on a failing alternative rather than falling back", async () => {

			const fallback = vi.fn((value: number) => value);

			await expect(pipe(
				(items([1, 2]))
				(coalesce(map(() => { throw new TaskError(); }), map(fallback)))
				(toArray())
			)).rejects.toBeInstanceOf(TaskError);

			expect(fallback).not.toHaveBeenCalled();

		});

	});

	describe("closing", () => {

		it("draws no item beyond the ones consumed", async () => {

			const drawn: number[] = [];
			const closed = { value: false };

			const iterator = tracked(drawn, closed, [1, 2, 3, 4])(coalesce(map(value => value)))[Symbol.asyncIterator]();

			await iterator.next();
			await iterator.next();

			expect(drawn).toEqual([1, 2]);

		});

		it("closes the source when closed early", async () => {

			const drawn: number[] = [];
			const closed = { value: false };

			await pipe(
				(tracked(drawn, closed, [1, 2, 3, 4]))
				(coalesce(map(value => value)))
				(take(1))
				(toArray())
			);

			expect(closed.value).toBe(true);

		});

	});

});
