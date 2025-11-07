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
import { Throttle } from "./throttle.js";


describe("Throttle", () => {

	describe("Throttle()", () => {

		it("should create a throttle with default parameters", () => {
			const throttle = Throttle();
			expect(throttle).toBeDefined();
			expect(throttle.queue).toBeDefined();
			expect(throttle.adapt).toBeDefined();
		});

		it("should create a throttle with custom parameters", () => {
			const throttle = Throttle({
				minimum: 100,
				maximum: 5000,
				buildup: 1.5,
				backoff: 2.0,
				recover: 0.5
			});
			expect(throttle).toBeDefined();
		});

		it("should handle zero maximum as no limit", () => {
			const throttle = Throttle({ minimum: 100, maximum: 0 });
			expect(throttle).toBeDefined();
		});


		it("should reject negative minimum delay", () => {
			expect(() => Throttle({ minimum: -1 }))
				.toThrow("negative minimum delay <-1>");
		});

		it("should reject negative maximum delay", () => {
			expect(() => Throttle({ maximum: -1 }))
				.toThrow("negative maximum delay <-1>");
		});

		it("should reject minimum greater than maximum", () => {
			expect(() => Throttle({ minimum: 1000, maximum: 100 }))
				.toThrow("conflicting minimum <1000> and maximum <100> delays");
		});

		it("should reject buildup less than 1.0", () => {
			expect(() => Throttle({ buildup: 0.5 }))
				.toThrow("illegal buildup factor <0.500>");
		});

		it("should reject backoff less than 1.0", () => {
			expect(() => Throttle({ backoff: 0.9 }))
				.toThrow("illegal backoff factor <0.900>");
		});

		it("should reject recover less than 0", () => {
			expect(() => Throttle({ recover: -0.1 }))
				.toThrow("illegal recover factor <-0.100>");
		});

		it("should reject recover greater than 1.0", () => {
			expect(() => Throttle({ recover: 1.5 }))
				.toThrow("illegal recover factor <1.500>");
		});

		it("should accept buildup exactly 1.0", () => {
			expect(() => Throttle({ buildup: 1.0 })).not.toThrow();
		});

		it("should accept backoff exactly 1.0", () => {
			expect(() => Throttle({ backoff: 1.0 })).not.toThrow();
		});

		it("should accept recover exactly 0.0", () => {
			expect(() => Throttle({ recover: 0.0 })).not.toThrow();
		});

		it("should accept recover exactly 1.0", () => {
			expect(() => Throttle({ recover: 1.0 })).not.toThrow();
		});

	});

	describe("queue(boolean?)", () => {

		it("should resolve immediately with no minimum delay", async () => {
			const throttle = Throttle();
			const start = Date.now();
			const elapsed = await throttle.queue();
			const duration = Date.now() - start;

			expect(elapsed).toBeGreaterThanOrEqual(0);
			expect(duration).toBeLessThan(50); // Should be very fast
		});

		it("should enforce minimum delay between executions", async () => {
			const throttle = Throttle({ minimum: 20 });

			const start = Date.now();
			await throttle.queue(false);
			await throttle.queue(false);
			const duration = Date.now() - start;

			expect(duration).toBeGreaterThanOrEqual(20);
			expect(duration).toBeLessThan(100);
		});

		it("should increment queue when adapt is true", async () => {
			const throttle = Throttle({ minimum: 10, buildup: 2.0 });

			await throttle.queue(true); // queue = 1
			const start = Date.now();
			await throttle.queue(false); // Should wait due to buildup
			const duration = Date.now() - start;

			// With buildup=2.0 and queue=1, delay should be 10*2^1 = 20ms
			expect(duration).toBeGreaterThanOrEqual(15); // Allow some variance

			throttle.adapt(true); // Decrement queue
		});

		it("should not increment queue when adapt is false", async () => {
			const throttle = Throttle({ minimum: 10, buildup: 2.0 });

			await throttle.queue(false); // queue = 0
			const start = Date.now();
			await throttle.queue(false); // Should only wait minimum delay
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(30); // Should not apply buildup
		});

		it("should respect maximum delay", async () => {
			const throttle = Throttle({
				minimum: 5,
				maximum: 20,
				buildup: 10.0 // Would cause very large delays without max
			});

			await throttle.queue(true);
			await throttle.queue(true);
			await throttle.queue(true);

			const start = Date.now();
			await throttle.queue(false);
			const duration = Date.now() - start;

			// Should be capped at maximum=20ms despite high buildup
			expect(duration).toBeLessThan(40);

			// Clean up queue
			throttle.adapt(true);
			throttle.adapt(true);
			throttle.adapt(true);
		});

	});

	describe("queue(value)", () => {

		it("should pass through the value unchanged", async () => {
			const throttle = Throttle();
			const value = { test: "data" };
			const result = await throttle.queue(value);

			expect(result).toBe(value);
		});

		it("should work with primitive values", async () => {
			const throttle = Throttle();

			expect(await throttle.queue(42)).toBe(42);
			expect(await throttle.queue("test")).toBe("test");
			// Note: boolean values cannot be passed through as they're reserved for the adapt parameter
		});

		it("should apply throttling delay", async () => {
			const throttle = Throttle({ minimum: 10 });

			const start = Date.now();
			await throttle.queue("value1");
			await throttle.queue("value2");
			const duration = Date.now()-start;

			expect(duration).toBeGreaterThanOrEqual(10);
		});

		it("should not increment queue counter", async () => {
			const throttle = Throttle({ minimum: 10, buildup: 2.0 });

			await throttle.queue("value1");
			const start = Date.now();
			await throttle.queue("value2");
			const duration = Date.now()-start;

			// Should not apply buildup since queue is not incremented
			expect(duration).toBeLessThan(30);
		});

	});

	describe("adapt()", () => {

		it("should accept boolean parameter for success", () => {
			const throttle = Throttle({ minimum: 10 });
			expect(() => throttle.adapt(true)).not.toThrow();
		});

		it("should accept boolean parameter for failure", () => {
			const throttle = Throttle({ minimum: 10 });
			expect(() => throttle.adapt(false)).not.toThrow();
		});

		it("should accept number parameter for retry delay", () => {
			const throttle = Throttle({ minimum: 10 });
			expect(() => throttle.adapt(50)).not.toThrow();
		});

		it("should accept zero for successful completion", () => {
			const throttle = Throttle({ minimum: 10 });
			expect(() => throttle.adapt(0)).not.toThrow();
		});

		it("should reject negative retry delay", () => {
			const throttle = Throttle();
			expect(() => throttle.adapt(-100)).toThrow("negative delay <-100>");
		});

		it("should reduce delay on success with recover factor", async () => {
			const throttle = Throttle({
				minimum: 10,
				backoff: 2.0,
				recover: 0.5
			});

			await throttle.queue();
			throttle.adapt(false); // Increase delay to 20
			const delay1 = throttle.adapt(true); // Should reduce to 10

			expect(delay1).toBe(10); // 20 * 0.5 = 10
		});

		it("should increase delay on failure with backoff factor", async () => {
			const throttle = Throttle({
				minimum: 10,
				backoff: 2.0,
				recover: 0.5
			});

			await throttle.queue();
			const delay = throttle.adapt(false); // Should increase to 20

			expect(delay).toBe(20); // 10 * 2.0 = 20
		});

		it("should respect minimum delay on recovery", async () => {
			const throttle = Throttle({
				minimum: 10,
				recover: 0.1 // Would drop below minimum
			});

			await throttle.queue();
			const delay = throttle.adapt(true);

			expect(delay).toBeGreaterThanOrEqual(10);
		});

		it("should respect maximum delay on backoff", async () => {
			const throttle = Throttle({
				minimum: 10,
				maximum: 50,
				backoff: 10.0 // Would exceed maximum
			});

			await throttle.queue();
			const delay = throttle.adapt(false);

			expect(delay).toBeLessThanOrEqual(50);
		});

		it("should use explicit retry delay when provided", async () => {
			const throttle = Throttle({
				minimum: 10,
				backoff: 2.0
			});

			await throttle.queue();
			const delay = throttle.adapt(100); // Explicit retry of 100ms

			expect(delay).toBe(100);
		});

	});


	describe("adaptive behavior", () => {

		it("should apply exponential buildup based on queue size", async () => {
			const throttle = Throttle({
				minimum: 10,
				buildup: 2.0
			});

			await throttle.queue(true); // queue = 1
			await throttle.queue(true); // queue = 2

			const start = Date.now();
			await throttle.queue(false); // Should wait: 10 * 2^2 = 40ms
			const duration = Date.now() - start;

			expect(duration).toBeGreaterThanOrEqual(30); // Allow variance

			throttle.adapt(true);
			throttle.adapt(true);
		});

	it("should restrict to one task after failure", async () => {
		const throttle = Throttle({ minimum: 10 });

		// Start and fail first task
		await throttle.queue(true); // queue = 1
		throttle.adapt(false); // queue = 0, dirty = true

		// Start second task (should succeed since queue was 0)
		await throttle.queue(true); // queue = 1, dirty still true

		// Third task should be blocked while dirty = true and queue > 0
		const queuePromise = throttle.queue(true);
		const timeoutPromise = new Promise(resolve => setTimeout(resolve, 30));

		const result = await Promise.race([
			queuePromise.then(() => "completed"),
			timeoutPromise.then(() => "timeout")
		]);

		// Should timeout because dirty flag blocks concurrent tasks
		expect(result).toBe("timeout");

		throttle.adapt(true); // Complete second task, clears dirty flag
	});

		it("should clear dirty flag on successful completion", async () => {
			const throttle = Throttle({ minimum: 10 });

			await throttle.queue(true);
			throttle.adapt(false); // Set dirty flag
			throttle.adapt(true); // Clear dirty flag

			// Should now allow concurrent tasks again
			const start = Date.now();
			await throttle.queue(false);
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(30); // Should not be blocked
		});

		it("should implement exponential backoff on repeated failures", async () => {
			const throttle = Throttle({
				minimum: 10,
				backoff: 2.0
			});

			await throttle.queue();
			let delay = throttle.adapt(false); // 20
			expect(delay).toBe(20);

			await throttle.queue();
			delay = throttle.adapt(false); // 40
			expect(delay).toBe(40);

			await throttle.queue();
			delay = throttle.adapt(false); // 80
			expect(delay).toBe(80);
		});

		it("should implement exponential recovery on repeated successes", async () => {
			const throttle = Throttle({
				minimum: 10,
				backoff: 4.0,
				recover: 0.5
			});

			await throttle.queue();
			throttle.adapt(false); // 40

			await throttle.queue();
			let delay = throttle.adapt(true); // 20
			expect(delay).toBe(20);

			await throttle.queue();
			delay = throttle.adapt(true); // 10
			expect(delay).toBe(10);

			await throttle.queue();
			delay = throttle.adapt(true); // Still 10 (minimum)
			expect(delay).toBe(10);
		});

	});

	describe("concurrency", () => {

		it("should handle multiple concurrent queue calls", async () => {
			const throttle = Throttle({ minimum: 10 });

			const results = await Promise.all([
				throttle.queue(false),
				throttle.queue(false),
				throttle.queue(false)
			]);

			expect(results).toHaveLength(3);
			results.forEach(elapsed => {
				expect(elapsed).toBeGreaterThanOrEqual(0);
			});
		});

		it("should serialize execution with queue tracking", async () => {
			const throttle = Throttle({
				minimum: 10,
				buildup: 2.0
			});

			const start = Date.now();

			// Launch 3 tasks concurrently
			const task1 = throttle.queue(true);
			const task2 = throttle.queue(true);
			const task3 = throttle.queue(true);

			await task1;
			await task2;
			await task3;

			const duration = Date.now() - start;

			// First: 0ms, Second: ~20ms (10*2^1), Third: ~40ms (10*2^2)
			// Total should be at least 60ms
			expect(duration).toBeGreaterThanOrEqual(50);

			throttle.adapt(true);
			throttle.adapt(true);
			throttle.adapt(true);
		});

	});

	describe("edge cases", () => {

		it("should handle zero minimum and maximum", async () => {
			const throttle = Throttle({ minimum: 0, maximum: 0 });

			const start = Date.now();
			await throttle.queue();
			await throttle.queue();
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(50); // Should be very fast
		});

		it("should handle buildup of 1.0 (no queue effect)", async () => {
			const throttle = Throttle({
				minimum: 10,
				buildup: 1.0
			});

			await throttle.queue(true);
			await throttle.queue(true);

			const start = Date.now();
			await throttle.queue(false);
			const duration = Date.now() - start;

			// With buildup=1.0, delay should be 10*1^n = 10 regardless of queue
			expect(duration).toBeLessThan(30);

			throttle.adapt(true);
			throttle.adapt(true);
		});

		it("should handle backoff of 1.0 (no increase on failure)", async () => {
			const throttle = Throttle({
				minimum: 10,
				backoff: 1.0
			});

			await throttle.queue();
			const delay = throttle.adapt(false);

			expect(delay).toBe(10); // 10 * 1.0 = 10
		});

		it("should handle recover of 1.0 (no decrease on success)", async () => {
			const throttle = Throttle({
				minimum: 10,
				backoff: 2.0,
				recover: 1.0
			});

			await throttle.queue();
			throttle.adapt(false); // Increase to 20

			await throttle.queue();
			const delay = throttle.adapt(true);

			expect(delay).toBe(20); // 20 * 1.0 = 20
		});

		it("should handle very large buildup values", async () => {
			const throttle = Throttle({
				minimum: 5,
				maximum: 20,
				buildup: 100.0
			});

			await throttle.queue(true);

			const start = Date.now();
			await throttle.queue(false);
			const duration = Date.now() - start;

			// Should be capped at maximum despite large buildup
			expect(duration).toBeLessThan(40);

			throttle.adapt(true);
		});

		it("should handle minimum equal to maximum", async () => {
			const throttle = Throttle({
				minimum: 10,
				maximum: 10,
				backoff: 2.0
			});

			await throttle.queue();
			const delay = throttle.adapt(false);

			// Delay should stay at 10 despite backoff
			expect(delay).toBe(10);
		});

	});

});
