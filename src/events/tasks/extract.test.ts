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

import { when } from "@/events/tasks/extract.js";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toSet } from "@metreeca/flow/sinks";
import { filter, map } from "@metreeca/flow/tasks";
import { describe, expect, it } from "vitest";


const even = (value: number): boolean => value%2 === 0;


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

	it("routes an item to one reading alone", async () => {

		expect(await pipe(
			(items([1, 2, 3, 4]))
			(when(even, map(value => `${value} even`), map(value => `${value} odd`)))
			(toSet())
		)).not.toContain("2 odd");

	});

});
