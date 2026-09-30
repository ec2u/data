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

import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { describe, expect, it } from "vitest";
import { retire } from "./retire.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("retire", () => {

	it("emits the existing items the incoming feed no longer names", async () => {

		const existing = items(["/items/1", "/items/2", "/items/3", "/items/4"]);

		expect(await items(["/items/1", "/items/2", "/items/3"])(retire({ survival: 0, existing }))(toArray()))
			.toEqual(["/items/4"]);

	});

	it("emits nothing where the incoming feed names every existing item", async () => {

		const existing = items(["/items/1", "/items/2"]);

		expect(await items(["/items/1", "/items/2"])(retire({ survival: 0, existing }))(toArray()))
			.toEqual([]);

	});

	it("ignores incoming items the collection doesn't hold", async () => {

		const existing = items(["/items/1"]);

		expect(await items(["/items/1", "/items/2"])(retire({ survival: 0, existing }))(toArray()))
			.toEqual([]);

	});

	it("emits each existing item once", async () => {

		const existing = items(["/items/1", "/items/1", "/items/2"]);

		expect(await items([])(retire({ survival: 0, existing }))(toArray()))
			.toEqual(["/items/1", "/items/2"]);

	});

	it("rejects a survival rate outside [0, 1] as the task is created", async () => {

		expect(() => retire({ survival: -0.1, existing: items([]) })).toThrow(TypeError);
		expect(() => retire({ survival: 1.1, existing: items([]) })).toThrow(TypeError);

	});


	describe("above the survival floor", () => {

		it("emits the retired items", async () => {

			const existing = items(["/items/1", "/items/2", "/items/3", "/items/4"]);

			expect(await items(["/items/1", "/items/2", "/items/3"])(retire({ survival: 0.75, existing }))(toArray()))
				.toEqual(["/items/4"]);

		});

		it("rounds a fractional floor up to a whole item", async () => {

			const existing = items(["/items/1", "/items/2", "/items/3"]);

			expect(await items(["/items/1", "/items/2"])(retire({ survival: 0.5, existing }))(toArray()))
				.toEqual(["/items/3"]);

		});

		it("retires every existing item where the scan renames them all", async () => {

			const existing = items(["/items/1", "/items/2", "/items/3", "/items/4"]);

			expect(await items(["/renamed/1", "/renamed/2", "/renamed/3", "/renamed/4"])
			(retire({ survival: 0.75, existing }))(toArray()))
				.toEqual(["/items/1", "/items/2", "/items/3", "/items/4"]);

		});

		it("weighs the scan rather than the identifiers it carries over", async () => {

			const existing = items(["/items/1", "/items/2", "/items/3", "/items/4"]);

			expect(await items(["/items/1", "/renamed/2", "/renamed/3", "/renamed/4"])
			(retire({ survival: 0.75, existing }))(toArray()))
				.toEqual(["/items/2", "/items/3", "/items/4"]);

		});

	});


	describe("below the survival floor", () => {

		it("skips the retirements", async () => {

			const existing = items(["/items/1", "/items/2", "/items/3", "/items/4"]);

			expect(await items(["/items/1"])(retire({ survival: 0.75, existing }))(toArray()))
				.toEqual([]);

		});

		it("aborts the update under atomic", async () => {

			const existing = items(["/items/1", "/items/2", "/items/3", "/items/4"]);

			await expect(items(["/items/1"])(retire({ atomic: true, survival: 0.75, existing }))(toArray()))
				.rejects.toThrow(RangeError);

		});

		it("skips the retirements where a short scan names none of the existing items", async () => {

			const existing = items(["/items/1", "/items/2", "/items/3", "/items/4"]);

			expect(await items(["/renamed/1"])(retire({ survival: 0.75, existing }))(toArray()))
				.toEqual([]);

		});

	});


	describe("with a degenerate survival rate", () => {

		it("retires nothing at 1", async () => {

			const existing = items(["/items/1", "/items/2"]);

			expect(await items(["/items/1"])(retire({ survival: 1, existing }))(toArray()))
				.toEqual([]);

		});

		it("retires every existing item at 0", async () => {

			const existing = items(["/items/1", "/items/2"]);

			expect(await items([])(retire({ survival: 0, existing }))(toArray()))
				.toEqual(["/items/1", "/items/2"]);

		});

	});

});
