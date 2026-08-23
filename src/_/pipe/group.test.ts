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

import { items } from "@metreeca/pipe/feeds";
import { toArray } from "@metreeca/pipe/sinks";
import { describe, expect, it } from "vitest";
import { group } from "./group.js";


describe("group()", () => {

	it("should group items sharing the same key", async () => {

		const values = await items([1, 2, 3, 4])(group(n => n%2))(toArray());

		expect(values).toEqual([[1, [1, 3]], [0, [2, 4]]]);

	});

	it("should emit groups in first-appearance order of their key", async () => {

		const values = await items(["bb", "a", "cc", "d"])(group(s => s.length))(toArray());

		expect(values).toEqual([[2, ["bb", "cc"]], [1, ["a", "d"]]]);

	});

	it("should preserve source order inside groups", async () => {

		const values = await items([3, 1, 5, 2])(group(() => "all"))(toArray());

		expect(values).toEqual([["all", [3, 1, 5, 2]]]);

	});

	it("should emit nothing for an empty source", async () => {

		const values = await items<number>([])(group(n => n))(toArray());

		expect(values).toEqual([]);

	});

	it("should support asynchronous key functions", async () => {

		const values = await items([1, 2, 3])(group(async n => n%2))(toArray());

		expect(values).toEqual([[1, [1, 3]], [0, [2]]]);

	});

	it("should collapse keys sharing SameValueZero identity", async () => {

		const values = await items([1, 2, 3])(group(n => n === 2 ? -0 : NaN))(toArray());

		expect(values).toEqual([[NaN, [1, 3]], [0, [2]]]);

	});

	it("should group items under boolean keys", async () => {

		const values = await items([1, 2, 3, 4])(group(n => n%2 === 1))(toArray());

		expect(values).toEqual([[true, [1, 3]], [false, [2, 4]]]);

	});

	it("should group items under nullish keys", async () => {

		const values = await items([1, 2, 3])(group(n => n === 2 ? null : undefined))(toArray());

		expect(values).toEqual([[undefined, [1, 3]], [null, [2]]]);

	});

	it("should reject keys that are not record keys", () => {

		// @ts-expect-error object keys don't support identity comparison

		group((n: number) => ({ id: n }));

	});

});
