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
import { Mutex } from "./mutex";

describe("Mutex", () => {

	describe("Mutex()", () => {

		it("should create a mutex", () => {
			const mutex = Mutex();
			expect(mutex).toBeDefined();
			expect(mutex.execute).toBeDefined();
		});

	});

	describe("execute()", () => {

		it("should execute a synchronous task", async () => {
			const mutex = Mutex();
			const result = await mutex.execute(() => 42);
			expect(result).toBe(42);
		});

		it("should execute an asynchronous task", async () => {
			const mutex = Mutex();
			const result = await mutex.execute(async () => {
				await new Promise(resolve => setTimeout(resolve, 10));
				return "done";
			});
			expect(result).toBe("done");
		});

		it("should execute tasks sequentially", async () => {
			const mutex = Mutex();
			const order: number[] = [];

			await Promise.all([
				mutex.execute(async () => {
					await new Promise(resolve => setTimeout(resolve, 30));
					order.push(1);
				}),
				mutex.execute(async () => {
					await new Promise(resolve => setTimeout(resolve, 10));
					order.push(2);
				}),
				mutex.execute(() => {
					order.push(3);
				})
			]);

			// Despite task 2 having shorter duration, order should be 1, 2, 3
			expect(order).toEqual([1, 2, 3]);
		});

		it("should handle task errors without breaking the mutex", async () => {
			const mutex = Mutex();
			const order: string[] = [];

			// First task succeeds
			await mutex.execute(() => {
				order.push("first");
			});

			// Second task fails
			await expect(
				mutex.execute(() => {
					order.push("second");
					throw new Error("Task failed");
				})
			).rejects.toThrow("Task failed");

			// Third task should still execute
			await mutex.execute(() => {
				order.push("third");
			});

			expect(order).toEqual(["first", "second", "third"]);
		});

		it("should properly release lock on task rejection", async () => {
			const mutex = Mutex();

			await expect(
				mutex.execute(() => {
					throw new Error("fail");
				})
			).rejects.toThrow("fail");

			// Subsequent task should not be blocked
			const result = await mutex.execute(() => "success");
			expect(result).toBe("success");
		});

		it("should prevent concurrent execution", async () => {
			const mutex = Mutex();
			let executing = false;
			let concurrencyViolation = false;

			const task = async () => {
				if ( executing ) {
					concurrencyViolation = true;
				}
				executing = true;
				await new Promise(resolve => setTimeout(resolve, 20));
				executing = false;
			};

			await Promise.all([
				mutex.execute(task),
				mutex.execute(task),
				mutex.execute(task)
			]);

			expect(concurrencyViolation).toBe(false);
		});

		it("should maintain FIFO order under concurrent submissions", async () => {
			const mutex = Mutex();
			const results: number[] = [];

			// Submit tasks concurrently
			const promises = [1, 2, 3, 4, 5].map(n =>
				mutex.execute(async () => {
					await new Promise(resolve => setTimeout(resolve, 5));
					results.push(n);
				})
			);

			await Promise.all(promises);

			expect(results).toEqual([1, 2, 3, 4, 5]);
		});

		it("should work with different return types", async () => {
			const mutex = Mutex();

			const num = await mutex.execute(() => 42);
			expect(num).toBe(42);

			const str = await mutex.execute(() => "hello");
			expect(str).toBe("hello");

			const obj = await mutex.execute(() => ({ key: "value" }));
			expect(obj).toEqual({ key: "value" });

			const arr = await mutex.execute(() => [1, 2, 3]);
			expect(arr).toEqual([1, 2, 3]);

			const undef = await mutex.execute(() => undefined);
			expect(undef).toBeUndefined();
		});

		it("should handle many concurrent tasks", async () => {
			const mutex = Mutex();
			const count = 100;
			const results: number[] = [];

			const promises = Array.from({ length: count }, (_, i) =>
				mutex.execute(() => {
					results.push(i);
				})
			);

			await Promise.all(promises);

			expect(results).toHaveLength(count);
			expect(results).toEqual(Array.from({ length: count }, (_, i) => i));
		});

		it("should handle re-entrant lock attempts gracefully", async () => {
			const mutex = Mutex();

			// This will deadlock in a naive implementation
			const result = await mutex.execute(async () => {
				// Attempting to acquire the same mutex again
				const innerPromise = mutex.execute(() => "inner");
				const timeoutPromise = new Promise(resolve =>
					setTimeout(() => resolve("timeout"), 50)
				);

				return Promise.race([innerPromise, timeoutPromise]);
			});

			// Should timeout because the inner task is waiting for the outer to complete
			expect(result).toBe("timeout");
		});

	});

});
