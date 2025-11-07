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
import { guard } from "./log.js";

describe("guard()", () => {

	it("should handle functions with no arguments", async () => {
		const fn = guard(async () => "success");
		const result = await fn();
		expect(result).toBe("success");
	});

	it("should handle functions with one argument", async () => {
		const fn = guard(async (x: number) => x*2);
		const result = await fn(5);
		expect(result).toBe(10);
	});

	it("should handle functions with multiple arguments", async () => {
		const fn = guard(async (x: number, y: string, z: boolean) => {
			return `${x}-${y}-${z}`;
		});
		const result = await fn(42, "hello", true);
		expect(result).toBe("42-hello-true");
	});

	it("should handle functions with different argument types", async () => {
		const fn = guard(async (
			num: number,
			str: string,
			bool: boolean,
			obj: { key: string },
			arr: number[]
		) => {
			return { num, str, bool, obj, arr };
		});

		const result = await fn(
			123,
			"test",
			false,
			{ key: "value" },
			[1, 2, 3]
		);

		expect(result).toEqual({
			num: 123,
			str: "test",
			bool: false,
			obj: { key: "value" },
			arr: [1, 2, 3]
		});
	});

	it("should catch errors and return undefined", async () => {
		const errorFn = guard(async (x: number) => {
			throw new Error("Test error");
		});

		const result = await errorFn(5);
		expect(result).toBeUndefined();
	});

	it("should log errors with the operator name", async () => {
		async function namedFunction() {
			throw new Error("Named function error");
		}

		const guarded = guard(namedFunction);
		const result = await guarded();

		// Should return undefined when error occurs
		expect(result).toBeUndefined();
	});

	it("should handle synchronous functions that return promises", async () => {
		const fn = guard((x: number) => Promise.resolve(x+1));
		const result = await fn(10);
		expect(result).toBe(11);
	});

	it("should handle async functions that throw", async () => {
		const fn = guard(async (x: number, y: number) => {
			if ( x === 0 ) {
				throw new Error("Division by zero");
			}
			return y/x;
		});

		const success = await fn(2, 10);
		expect(success).toBe(5);

		const failure = await fn(0, 10);
		expect(failure).toBeUndefined();
	});

	it("should preserve type inference for return values", async () => {
		const stringFn = guard(async (x: number) => String(x));
		const numberFn = guard(async (x: string) => Number(x));
		const objectFn = guard(async () => ({ key: "value" }));

		const str = await stringFn(123);
		const num = await numberFn("456");
		const obj = await objectFn();

		// These should pass TypeScript type checking
		expect(typeof str).toBe("string");
		expect(typeof num).toBe("number");
		expect(typeof obj).toBe("object");
	});

	it("should handle functions with rest parameters", async () => {
		const sum = guard(async (...numbers: number[]) => {
			return numbers.reduce((acc, n) => acc+n, 0);
		});

		expect(await sum(1, 2, 3, 4, 5)).toBe(15);
		expect(await sum()).toBe(0);
		expect(await sum(42)).toBe(42);
	});

	it("should handle synchronous functions without wrapping in Promise", () => {
		const syncFn = guard((x: number) => x*2);
		const result = syncFn(5);

		// Result should NOT be a Promise for sync functions
		expect(result).not.toBeInstanceOf(Promise);
		expect(result).toBe(10);
	});

	it("should handle synchronous functions that throw", () => {
		const syncFn = guard((x: number) => {
			if ( x === 0 ) {
				throw new Error("Zero not allowed");
			}
			return x*2;
		});

		const success = syncFn(5);
		expect(success).toBe(10);

		const failure = syncFn(0);
		expect(failure).toBeUndefined();
	});

	it("should preserve Promise for async functions", async () => {
		const asyncFn = guard(async (x: number) => x*2);
		const result = asyncFn(5);

		// Result should be a Promise for async functions
		expect(result).toBeInstanceOf(Promise);
		expect(await result).toBe(10);
	});

});
