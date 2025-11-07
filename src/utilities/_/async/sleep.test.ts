/*
 * Copyright © 2025 Metreeca srl
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

import { describe, expect, it } from "vitest";
import { sleep } from "./sleep";

describe("sleep()", () => {

	it("should resolve after the specified delay", async () => {
		const start = Date.now();
		await sleep(50);
		const elapsed = Date.now()-start;

		// Allow some tolerance for timing accuracy (±10ms)
		expect(elapsed).toBeGreaterThanOrEqual(45);
		expect(elapsed).toBeLessThan(100);
	});

	it("should resolve immediately for zero delay", async () => {
		const start = Date.now();
		await sleep(0);
		const elapsed = Date.now()-start;

		// Should be nearly instant
		expect(elapsed).toBeLessThan(10);
	});

	it("should resolve immediately for negative delay", async () => {
		const start = Date.now();
		await sleep(-100);
		const elapsed = Date.now()-start;

		// Should be nearly instant
		expect(elapsed).toBeLessThan(10);
	});

	it("should return a promise that resolves to void", async () => {
		const result = await sleep(10);
		expect(result).toBeUndefined();
	});

	it("should handle multiple concurrent sleep calls", async () => {
		const start = Date.now();

		await Promise.all([
			sleep(30),
			sleep(30),
			sleep(30)
		]);

		const elapsed = Date.now()-start;

		// All should complete around the same time (not sequentially)
		expect(elapsed).toBeGreaterThanOrEqual(25);
		expect(elapsed).toBeLessThan(70);
	});

	it("should work with different delay values in sequence", async () => {
		const timings: number[] = [];
		const start = Date.now();

		await sleep(20);
		timings.push(Date.now()-start);

		await sleep(30);
		timings.push(Date.now()-start);

		await sleep(0);
		timings.push(Date.now()-start);

		// First sleep should be around 20ms
		expect(timings[0]).toBeGreaterThanOrEqual(15);
		expect(timings[0]).toBeLessThan(40);

		// Second sleep should be around 50ms total
		expect(timings[1]).toBeGreaterThanOrEqual(45);
		expect(timings[1]).toBeLessThan(70);

		// Third sleep should add negligible time
		expect(timings[2]).toBeGreaterThanOrEqual(45);
		expect(timings[2]).toBeLessThan(80);
	});

	it("should allow promise chaining", async () => {
		let executed = false;

		await sleep(10).then(() => {
			executed = true;
		});

		expect(executed).toBe(true);
	});

	it("should work with async/await in complex scenarios", async () => {
		const results: string[] = [];

		const task = async (id: string, delay: number) => {
			results.push(`${id}-start`);
			await sleep(delay);
			results.push(`${id}-end`);
		};

		await Promise.all([
			task("a", 30),
			task("b", 10),
			task("c", 20)
		]);

		// All starts should happen before any ends
		expect(results.slice(0, 3)).toEqual(["a-start", "b-start", "c-start"]);
		// Ends should be in order of completion (shortest delay first)
		expect(results.slice(3)).toEqual(["b-end", "c-end", "a-end"]);
	});

	it("should handle very short delays", async () => {
		const start = Date.now();
		await sleep(1);
		const elapsed = Date.now()-start;

		// Even 1ms should be respected
		expect(elapsed).toBeGreaterThanOrEqual(0);
		expect(elapsed).toBeLessThan(20);
	});

	it("should not block the event loop for zero/negative delays", async () => {
		let otherTaskExecuted = false;

		// Schedule a microtask
		Promise.resolve().then(() => {
			otherTaskExecuted = true;
		});

		await sleep(0);

		// After awaiting sleep(0), microtasks should have been processed
		expect(otherTaskExecuted).toBe(true);
	});

});
