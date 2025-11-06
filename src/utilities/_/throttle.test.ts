/*
 * Copyright © 2020-2025 EC2U Alliance
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

import { describe, expect, it, beforeEach, vi } from "vitest";
import { createThrottle, type Throttle } from "./throttle.js";

describe("createThrottle", () => {

	describe("initialization", () => {

		it("should create a throttle with default parameters", () => {
			const throttle = createThrottle();
			expect(throttle).toBeDefined();
			expect(throttle.await).toBeDefined();
			expect(throttle.adapt).toBeDefined();
			expect(throttle.apply).toBeDefined();
		});

		it("should create a throttle with custom parameters", () => {
			const throttle = createThrottle({
				minimum: 100,
				maximum: 5000,
				buildup: 1.5,
				backoff: 2.0,
				recover: 0.5
			});
			expect(throttle).toBeDefined();
		});

		it("should handle zero maximum as no limit", () => {
			const throttle = createThrottle({ minimum: 100, maximum: 0 });
			expect(throttle).toBeDefined();
		});

	});

	describe("parameter validation", () => {

		it("should reject negative minimum delay", () => {
			expect(() => createThrottle({ minimum: -1 }))
				.toThrow("negative minimum delay <-1>");
		});

		it("should reject negative maximum delay", () => {
			expect(() => createThrottle({ maximum: -1 }))
				.toThrow("negative maximum delay <-1>");
		});

		it("should reject minimum greater than maximum", () => {
			expect(() => createThrottle({ minimum: 1000, maximum: 100 }))
				.toThrow("conflicting minimum <1000> and maximum <100> delays");
		});

		it("should reject buildup less than 1.0", () => {
			expect(() => createThrottle({ buildup: 0.5 }))
				.toThrow("illegal buildup factor <0.500>");
		});

		it("should reject backoff less than 1.0", () => {
			expect(() => createThrottle({ backoff: 0.9 }))
				.toThrow("illegal backoff factor <0.900>");
		});

		it("should reject recover less than 0", () => {
			expect(() => createThrottle({ recover: -0.1 }))
				.toThrow("illegal recover factor <-0.100>");
		});

		it("should reject recover greater than 1.0", () => {
			expect(() => createThrottle({ recover: 1.5 }))
				.toThrow("illegal recover factor <1.500>");
		});

		it("should accept buildup exactly 1.0", () => {
			expect(() => createThrottle({ buildup: 1.0 })).not.toThrow();
		});

		it("should accept backoff exactly 1.0", () => {
			expect(() => createThrottle({ backoff: 1.0 })).not.toThrow();
		});

		it("should accept recover exactly 0.0", () => {
			expect(() => createThrottle({ recover: 0.0 })).not.toThrow();
		});

		it("should accept recover exactly 1.0", () => {
			expect(() => createThrottle({ recover: 1.0 })).not.toThrow();
		});

	});

	describe("await()", () => {

		it("should resolve immediately with no minimum delay", async () => {
			const throttle = createThrottle();
			const start = Date.now();
			const elapsed = await throttle.await();
			const duration = Date.now() - start;

			expect(elapsed).toBeGreaterThanOrEqual(0);
			expect(duration).toBeLessThan(50); // Should be very fast
		});

		it("should enforce minimum delay between executions", async () => {
			const throttle = createThrottle({ minimum: 100 });

			const start = Date.now();
			await throttle.await(false);
			await throttle.await(false);
			const duration = Date.now() - start;

			expect(duration).toBeGreaterThanOrEqual(100);
			expect(duration).toBeLessThan(400); // Allow more variance for test timing
		});

		it("should increment queue when adapt is true", async () => {
			const throttle = createThrottle({ minimum: 50, buildup: 2.0 });

			await throttle.await(true); // queue = 1
			const start = Date.now();
			await throttle.await(false); // Should wait due to buildup
			const duration = Date.now() - start;

			// With buildup=2.0 and queue=1, delay should be 50*2^1 = 100ms
			expect(duration).toBeGreaterThanOrEqual(80); // Allow some variance

			throttle.adapt(true); // Decrement queue
		});

		it("should not increment queue when adapt is false", async () => {
			const throttle = createThrottle({ minimum: 50, buildup: 2.0 });

			await throttle.await(false); // queue = 0
			const start = Date.now();
			await throttle.await(false); // Should only wait minimum delay
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(100); // Should not apply buildup
		});

		it("should respect maximum delay", async () => {
			const throttle = createThrottle({
				minimum: 10,
				maximum: 50,
				buildup: 10.0 // Would cause very large delays without max
			});

			await throttle.await(true);
			await throttle.await(true);
			await throttle.await(true);

			const start = Date.now();
			await throttle.await(false);
			const duration = Date.now() - start;

			// Should be capped at maximum=50ms despite high buildup
			expect(duration).toBeLessThan(100);

			// Clean up queue
			throttle.adapt(true);
			throttle.adapt(true);
			throttle.adapt(true);
		});

	});

	describe("adapt()", () => {

		it("should accept boolean parameter for success", () => {
			const throttle = createThrottle({ minimum: 100 });
			expect(() => throttle.adapt(true)).not.toThrow();
		});

		it("should accept boolean parameter for failure", () => {
			const throttle = createThrottle({ minimum: 100 });
			expect(() => throttle.adapt(false)).not.toThrow();
		});

		it("should accept number parameter for retry delay", () => {
			const throttle = createThrottle({ minimum: 100 });
			expect(() => throttle.adapt(500)).not.toThrow();
		});

		it("should accept zero for successful completion", () => {
			const throttle = createThrottle({ minimum: 100 });
			expect(() => throttle.adapt(0)).not.toThrow();
		});

		it("should reject negative retry delay", () => {
			const throttle = createThrottle();
			expect(() => throttle.adapt(-100)).toThrow("negative delay <-100>");
		});

		it("should reduce delay on success with recover factor", async () => {
			const throttle = createThrottle({
				minimum: 100,
				backoff: 2.0,
				recover: 0.5
			});

			await throttle.await();
			throttle.adapt(false); // Increase delay to 200
			const delay1 = throttle.adapt(true); // Should reduce to 100

			expect(delay1).toBe(100); // 200 * 0.5 = 100
		});

		it("should increase delay on failure with backoff factor", async () => {
			const throttle = createThrottle({
				minimum: 100,
				backoff: 2.0,
				recover: 0.5
			});

			await throttle.await();
			const delay = throttle.adapt(false); // Should increase to 200

			expect(delay).toBe(200); // 100 * 2.0 = 200
		});

		it("should respect minimum delay on recovery", async () => {
			const throttle = createThrottle({
				minimum: 100,
				recover: 0.1 // Would drop below minimum
			});

			await throttle.await();
			const delay = throttle.adapt(true);

			expect(delay).toBeGreaterThanOrEqual(100);
		});

		it("should respect maximum delay on backoff", async () => {
			const throttle = createThrottle({
				minimum: 100,
				maximum: 500,
				backoff: 10.0 // Would exceed maximum
			});

			await throttle.await();
			const delay = throttle.adapt(false);

			expect(delay).toBeLessThanOrEqual(500);
		});

		it("should use explicit retry delay when provided", async () => {
			const throttle = createThrottle({
				minimum: 100,
				backoff: 2.0
			});

			await throttle.await();
			const delay = throttle.adapt(1000); // Explicit retry of 1000ms

			expect(delay).toBe(1000);
		});

	});

	describe("apply()", () => {

		it("should pass through the value unchanged", async () => {
			const throttle = createThrottle();
			const value = { test: "data" };
			const result = await throttle.apply(value);

			expect(result).toBe(value);
		});

		it("should work with primitive values", async () => {
			const throttle = createThrottle();

			expect(await throttle.apply(42)).toBe(42);
			expect(await throttle.apply("test")).toBe("test");
			expect(await throttle.apply(true)).toBe(true);
		});

		it("should apply throttling delay", async () => {
			const throttle = createThrottle({ minimum: 50 });

			const start = Date.now();
			await throttle.apply("value1");
			await throttle.apply("value2");
			const duration = Date.now() - start;

			expect(duration).toBeGreaterThanOrEqual(50);
		});

		it("should not increment queue counter", async () => {
			const throttle = createThrottle({ minimum: 50, buildup: 2.0 });

			await throttle.apply("value1");
			const start = Date.now();
			await throttle.apply("value2");
			const duration = Date.now() - start;

			// Should not apply buildup since queue is not incremented
			expect(duration).toBeLessThan(100);
		});

	});

	describe("builder methods", () => {

		it("should create new instance with withMinimum", () => {
			const throttle1 = createThrottle({ minimum: 100 });
			const throttle2 = throttle1.withMinimum(200);

			expect(throttle2).not.toBe(throttle1);
		});

		it("should create new instance with withMaximum", () => {
			const throttle1 = createThrottle({ maximum: 1000 });
			const throttle2 = throttle1.withMaximum(2000);

			expect(throttle2).not.toBe(throttle1);
		});

		it("should create new instance with withBuildup", () => {
			const throttle1 = createThrottle({ buildup: 1.5 });
			const throttle2 = throttle1.withBuildup(2.0);

			expect(throttle2).not.toBe(throttle1);
		});

		it("should create new instance with withBackoff", () => {
			const throttle1 = createThrottle({ backoff: 1.5 });
			const throttle2 = throttle1.withBackoff(2.0);

			expect(throttle2).not.toBe(throttle1);
		});

		it("should create new instance with withRecover", () => {
			const throttle1 = createThrottle({ recover: 0.8 });
			const throttle2 = throttle1.withRecover(0.5);

			expect(throttle2).not.toBe(throttle1);
		});

		it("should preserve other parameters when using withMinimum", async () => {
			const throttle1 = createThrottle({
				minimum: 100,
				backoff: 3.0
			});
			const throttle2 = throttle1.withMinimum(200);

			await throttle2.await();
			const delay = throttle2.adapt(false);

			// Should still use backoff=3.0 from original
			expect(delay).toBe(600); // 200 * 3.0
		});

	});

	describe("adaptive behavior", () => {

		it("should apply exponential buildup based on queue size", async () => {
			const throttle = createThrottle({
				minimum: 50,
				buildup: 2.0
			});

			await throttle.await(true); // queue = 1
			await throttle.await(true); // queue = 2

			const start = Date.now();
			await throttle.await(false); // Should wait: 50 * 2^2 = 200ms
			const duration = Date.now() - start;

			expect(duration).toBeGreaterThanOrEqual(150); // Allow variance

			throttle.adapt(true);
			throttle.adapt(true);
		});

	it("should restrict to one task after failure", async () => {
		const throttle = createThrottle({ minimum: 50 });

		// Start and fail first task
		await throttle.await(true); // queue = 1
		throttle.adapt(false); // queue = 0, dirty = true

		// Start second task (should succeed since queue was 0)
		await throttle.await(true); // queue = 1, dirty still true

		// Third task should be blocked while dirty = true and queue > 0
		const awaitPromise = throttle.await(true);
		const timeoutPromise = new Promise(resolve => setTimeout(resolve, 100));

		const result = await Promise.race([
			awaitPromise.then(() => "completed"),
			timeoutPromise.then(() => "timeout")
		]);

		// Should timeout because dirty flag blocks concurrent tasks
		expect(result).toBe("timeout");

		throttle.adapt(true); // Complete second task, clears dirty flag
	});

		it("should clear dirty flag on successful completion", async () => {
			const throttle = createThrottle({ minimum: 50 });

			await throttle.await(true);
			throttle.adapt(false); // Set dirty flag
			throttle.adapt(true); // Clear dirty flag

			// Should now allow concurrent tasks again
			const start = Date.now();
			await throttle.await(false);
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(100); // Should not be blocked
		});

		it("should implement exponential backoff on repeated failures", async () => {
			const throttle = createThrottle({
				minimum: 100,
				backoff: 2.0
			});

			await throttle.await();
			let delay = throttle.adapt(false); // 200
			expect(delay).toBe(200);

			await throttle.await();
			delay = throttle.adapt(false); // 400
			expect(delay).toBe(400);

			await throttle.await();
			delay = throttle.adapt(false); // 800
			expect(delay).toBe(800);
		});

		it("should implement exponential recovery on repeated successes", async () => {
			const throttle = createThrottle({
				minimum: 100,
				backoff: 4.0,
				recover: 0.5
			});

			await throttle.await();
			throttle.adapt(false); // 400

			await throttle.await();
			let delay = throttle.adapt(true); // 200
			expect(delay).toBe(200);

			await throttle.await();
			delay = throttle.adapt(true); // 100
			expect(delay).toBe(100);

			await throttle.await();
			delay = throttle.adapt(true); // Still 100 (minimum)
			expect(delay).toBe(100);
		});

	});

	describe("concurrency", () => {

		it("should handle multiple concurrent await calls", async () => {
			const throttle = createThrottle({ minimum: 50 });

			const results = await Promise.all([
				throttle.await(false),
				throttle.await(false),
				throttle.await(false)
			]);

			expect(results).toHaveLength(3);
			results.forEach(elapsed => {
				expect(elapsed).toBeGreaterThanOrEqual(0);
			});
		});

		it("should serialize execution with queue tracking", async () => {
			const throttle = createThrottle({
				minimum: 50,
				buildup: 2.0
			});

			const start = Date.now();

			// Launch 3 tasks concurrently
			const task1 = throttle.await(true);
			const task2 = throttle.await(true);
			const task3 = throttle.await(true);

			await task1;
			await task2;
			await task3;

			const duration = Date.now() - start;

			// First: 0ms, Second: ~100ms (50*2^1), Third: ~200ms (50*2^2)
			// Total should be at least 300ms
			expect(duration).toBeGreaterThanOrEqual(250);

			throttle.adapt(true);
			throttle.adapt(true);
			throttle.adapt(true);
		});

	});

	describe("edge cases", () => {

		it("should handle zero minimum and maximum", async () => {
			const throttle = createThrottle({ minimum: 0, maximum: 0 });

			const start = Date.now();
			await throttle.await();
			await throttle.await();
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(50); // Should be very fast
		});

		it("should handle buildup of 1.0 (no queue effect)", async () => {
			const throttle = createThrottle({
				minimum: 50,
				buildup: 1.0
			});

			await throttle.await(true);
			await throttle.await(true);

			const start = Date.now();
			await throttle.await(false);
			const duration = Date.now() - start;

			// With buildup=1.0, delay should be 50*1^n = 50 regardless of queue
			expect(duration).toBeLessThan(100);

			throttle.adapt(true);
			throttle.adapt(true);
		});

		it("should handle backoff of 1.0 (no increase on failure)", async () => {
			const throttle = createThrottle({
				minimum: 100,
				backoff: 1.0
			});

			await throttle.await();
			const delay = throttle.adapt(false);

			expect(delay).toBe(100); // 100 * 1.0 = 100
		});

		it("should handle recover of 1.0 (no decrease on success)", async () => {
			const throttle = createThrottle({
				minimum: 100,
				backoff: 2.0,
				recover: 1.0
			});

			await throttle.await();
			throttle.adapt(false); // Increase to 200

			await throttle.await();
			const delay = throttle.adapt(true);

			expect(delay).toBe(200); // 200 * 1.0 = 200
		});

		it("should handle very large buildup values", async () => {
			const throttle = createThrottle({
				minimum: 10,
				maximum: 100,
				buildup: 100.0
			});

			await throttle.await(true);

			const start = Date.now();
			await throttle.await(false);
			const duration = Date.now() - start;

			// Should be capped at maximum despite large buildup
			expect(duration).toBeLessThan(200);

			throttle.adapt(true);
		});

		it("should handle minimum equal to maximum", async () => {
			const throttle = createThrottle({
				minimum: 100,
				maximum: 100,
				backoff: 2.0
			});

			await throttle.await();
			const delay = throttle.adapt(false);

			// Delay should stay at 100 despite backoff
			expect(delay).toBe(100);
		});

	});

});
