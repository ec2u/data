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
import { Case, Switch } from "./switch.js";


describe("Switch", () => {

	type TestCases = {
		value: string
		error: Error
		loading: boolean
	}

	describe("complete handlers", () => {

		it("should handle all cases with function handlers", () => {
			const result = Switch<TestCases>({ value: "success" })({
				value: (v) => `Value: ${v}`,
				error: (e) => `Error: ${e.message}`,
				loading: (l) => `Loading: ${l}`
			});

			expect(result).toBe("Value: success");
		});

		it("should handle all cases with constant handlers", () => {
			const result = Switch<TestCases>({ error: new Error("failed") })({
				value: 1,
				error: 2,
				loading: 3
			});

			expect(result).toBe(2);
		});

		it("should handle mixed function and constant handlers", () => {
			const result = Switch<TestCases>({ loading: true })({
				value: (v) => v.length,
				error: 0,
				loading: (l) => l ? 100 : 0
			});

			expect(result).toBe(100);
		});

		it("should correctly pass the active case value to handler", () => {
			const testError = new Error("test error");
			const result = Switch<TestCases>({ error: testError })({
				value: (v) => `value: ${v}`,
				error: (e) => e.message,
				loading: (l) => `loading: ${l}`
			});

			expect(result).toBe("test error");
		});

	});

	describe("partial handlers without fallback", () => {

		it("should return handler result when case matches", () => {
			const result = Switch<TestCases>({ value: "done" })({
				value: "matched",
				error: "error matched"
			});

			expect(result).toBe("matched");
		});

		it("should return undefined when case does not match any handler", () => {
			const result = Switch<TestCases>({ loading: true })({
				value: "value matched",
				error: "error matched"
			});

			expect(result).toBeUndefined();
		});

		it("should return undefined with empty handlers object", () => {
			const result = Switch<TestCases>({ value: "test" })({});

			expect(result).toBeUndefined();
		});

		it("should handle function handlers in partial mode", () => {
			const result = Switch<TestCases>({ error: new Error("oops") })({
				error: (e) => `Error occurred: ${e.message}`
			});

			expect(result).toBe("Error occurred: oops");
		});

	});

	describe("partial handlers with fallback", () => {

		it("should use specific handler when case matches", () => {
			const result = Switch<TestCases, "default">({ value: "hello" }, "default")({
				value: "specific handler",
				default: "fallback handler"
			});

			expect(result).toBe("specific handler");
		});

		it("should use fallback when case does not match any specific handler", () => {
			const result = Switch<TestCases, "default">({ loading: false }, "default")({
				value: "value handler",
				default: "fallback handler"
			});

			expect(result).toBe("fallback handler");
		});

		it("should pass value to fallback function handler", () => {
			const result = Switch<TestCases, "other">({ error: new Error("fail") }, "other")({
				value: (v) => `value: ${v}`,
				other: (v) => {
					if ( v instanceof Error ) {
						return `fallback error: ${v.message}`;
					}
					return `fallback: ${v}`;
				}
			});

			expect(result).toBe("fallback error: fail");
		});

		it("should use constant fallback handler", () => {
			const result = Switch<TestCases, "_">({ loading: true }, "_")({
				_: 999
			});

			expect(result).toBe(999);
		});

		it("should prefer specific handler over fallback", () => {
			const result = Switch<TestCases, "default">({ value: "test" }, "default")({
				value: "specific",
				error: "error",
				loading: "loading",
				default: "fallback"
			});

			expect(result).toBe("specific");
		});

	});

	describe("different case value types", () => {

		type MixedCases = {
			string: string
			number: number
			boolean: boolean
			object: { id: number, name: string }
			array: string[]
		}

		it("should handle string values", () => {
			const result = Switch<MixedCases>({ string: "hello" })({
				string: (v) => v.toUpperCase(),
				number: (n) => n.toString(),
				boolean: (b) => b.toString(),
				object: (o) => o.name,
				array: (a) => a.join(",")
			});

			expect(result).toBe("HELLO");
		});

		it("should handle number values", () => {
			const result = Switch<MixedCases>({ number: 42 })({
				string: (v) => v.length,
				number: (n) => n * 2,
				boolean: (b) => b ? 1 : 0,
				object: (o) => o.id,
				array: (a) => a.length
			});

			expect(result).toBe(84);
		});

		it("should handle boolean values", () => {
			const result = Switch<MixedCases>({ boolean: true })({
				string: "string",
				number: "number",
				boolean: (b) => b ? "yes" : "no",
				object: "object",
				array: "array"
			});

			expect(result).toBe("yes");
		});

		it("should handle object values", () => {
			const obj = { id: 123, name: "test" };
			const result = Switch<MixedCases>({ object: obj })({
				string: (v) => `string: ${v}`,
				number: (n) => `number: ${n}`,
				boolean: (b) => `boolean: ${b}`,
				object: (o) => `${o.name}:${o.id}`,
				array: (a) => `array: ${a.join(",")}`
			});

			expect(result).toBe("test:123");
		});

		it("should handle array values", () => {
			const arr = ["a", "b", "c"];
			const result = Switch<MixedCases>({ array: arr })({
				string: (v) => [v],
				number: (n) => [n.toString()],
				boolean: (b) => [b.toString()],
				object: (o) => [o.name],
				array: (a) => a.map(x => x.toUpperCase())
			});

			expect(result).toEqual(["A", "B", "C"]);
		});

	});

	describe("real-world use cases", () => {

		type AsyncResult<T> = {
			pending: undefined
			success: T
			failure: Error
		}

		it("should handle async operation states", () => {
			const pending = Switch<AsyncResult<string>>({ pending: undefined })({
				pending: "Loading...",
				success: (data) => `Success: ${data}`,
				failure: (err) => `Error: ${err.message}`
			});

			const success = Switch<AsyncResult<string>>({ success: "data loaded" })({
				pending: "Loading...",
				success: (data) => `Success: ${data}`,
				failure: (err) => `Error: ${err.message}`
			});

			const failure = Switch<AsyncResult<string>>({ failure: new Error("network error") })({
				pending: "Loading...",
				success: (data) => `Success: ${data}`,
				failure: (err) => `Error: ${err.message}`
			});

			expect(pending).toBe("Loading...");
			expect(success).toBe("Success: data loaded");
			expect(failure).toBe("Error: network error");
		});

		type HttpStatus = {
			ok: { data: string }
			notFound: { path: string }
			serverError: { code: number }
		}

		it("should handle HTTP response status patterns", () => {
			const ok = Switch<HttpStatus>({ ok: { data: "response" } })({
				ok: (res) => res.data,
				notFound: (err) => `Not found: ${err.path}`,
				serverError: (err) => `Server error: ${err.code}`
			});

			const notFound = Switch<HttpStatus>({ notFound: { path: "/api/users" } })({
				ok: (res) => res.data,
				notFound: (err) => `Not found: ${err.path}`,
				serverError: (err) => `Server error: ${err.code}`
			});

			expect(ok).toBe("response");
			expect(notFound).toBe("Not found: /api/users");
		});

		type FormState = {
			empty: undefined
			editing: { value: string }
			submitting: { value: string }
			submitted: { id: string }
		}

		it("should handle form state transitions with fallback", () => {
			const result = Switch<FormState, "default">({ editing: { value: "text" } }, "default")({
				submitted: (s) => `Submitted with id: ${s.id}`,
				default: "Form is not submitted"
			});

			expect(result).toBe("Form is not submitted");
		});

	});

	describe("undefined values", () => {

		type OptionCases = {
			some: string
			none: undefined
		}

		it("should handle undefined as a valid case value", () => {
			const result = Switch<OptionCases>({ none: undefined })({
				some: (v) => `Value: ${v}`,
				none: "No value"
			});

			expect(result).toBe("No value");
		});

		it("should distinguish undefined from missing property", () => {
			const result = Switch<OptionCases>({ none: undefined })({
				none: (v) => `none: ${v}`,
				some: (v) => `some: ${v}`
			});

			expect(result).toBe("none: undefined");
		});

	});

	describe("edge cases", () => {

		type EdgeCases = {
			zero: number
			emptyString: string
			falseBool: boolean
			nullValue: null
		}

		it("should handle zero as a value", () => {
			const result = Switch<EdgeCases>({ zero: 0 })({
				zero: (n) => `zero: ${n}`,
				emptyString: "empty",
				falseBool: "false",
				nullValue: "null"
			});

			expect(result).toBe("zero: 0");
		});

		it("should handle empty string as a value", () => {
			const result = Switch<EdgeCases>({ emptyString: "" })({
				zero: "zero",
				emptyString: (s) => `empty: ${s}`,
				falseBool: "false",
				nullValue: "null"
			});

			expect(result).toBe("empty: ");
		});

		it("should handle false as a value", () => {
			const result = Switch<EdgeCases>({ falseBool: false })({
				zero: "zero",
				emptyString: "empty",
				falseBool: (b) => `false: ${b}`,
				nullValue: "null"
			});

			expect(result).toBe("false: false");
		});

		it("should handle null as a value", () => {
			const result = Switch<EdgeCases>({ nullValue: null })({
				zero: "zero",
				emptyString: "empty",
				falseBool: "false",
				nullValue: (n) => `null: ${n}`
			});

			expect(result).toBe("null: null");
		});

	});

	describe("type system tests", () => {

		type TestCases = {
			boolean: boolean
			string: string
			number: number
		}

		describe("Case<C> type - ExactlyOne constraint", () => {

			it("should allow exactly one property", () => {
				// These assignments verify Case<C> accepts single properties
				const singleString: Case<TestCases> = { string: "test" };
				const singleBoolean: Case<TestCases> = { boolean: true };
				const singleNumber: Case<TestCases> = { number: 42 };

				// Runtime verification
				expect(singleString).toEqual({ string: "test" });
				expect(singleBoolean).toEqual({ boolean: true });
				expect(singleNumber).toEqual({ number: 42 });
			});

			// Note: The following tests verify compile-time type errors
			// They ensure TypeScript rejects invalid Case<C> values

			it("type check: should reject multiple properties", () => {
				// @ts-expect-error - cannot have two properties
				const multipleProps: Case<TestCases> = { string: "test", boolean: true };

				// This would fail at compile time, but we verify runtime behavior
				expect(multipleProps).toBeDefined();
			});

			it("type check: should reject empty object", () => {
				// @ts-expect-error - must have exactly one property
				const emptyObj: Case<TestCases> = {};

				// This would fail at compile time, but we verify runtime behavior
				expect(emptyObj).toBeDefined();
			});

		});

		describe("complete handlers", () => {

			it("should return R when all handlers provided", () => {
				const result: string = Switch<TestCases>({ string: "hello" })({
					boolean: (e) => `boolean: ${e}`,
					number: (n) => `number: ${n}`,
					string: (v) => `string: ${v}`
				});

				expect(result).toBe("string: hello");
			});

			it("should handle constant values as handlers", () => {
				const result: number = Switch<TestCases>({ boolean: true })({
					boolean: 1,
					number: 2,
					string: 3
				});

				expect(result).toBe(1);
			});

			it("should handle mixed function and constant handlers", () => {
				const result: boolean = Switch<TestCases>({ number: 123 })({
					boolean: false,
					number: (n) => n > 0,
					string: (v) => v.length > 0
				});

				expect(result).toBe(true);
			});

		});

		describe("partial handlers without fallback", () => {

			it("should return R | undefined when some handlers missing", () => {
				const result: string | undefined = Switch<TestCases>({ string: "test" })({
					string: "matched value",
					boolean: "matched error"
					// 'number' handler is missing - returns undefined if number case
				});

				expect(result).toBe("matched value");
			});

			it("should return undefined when no handler matches", () => {
				const result: string | undefined = Switch<TestCases>({ number: 42 })({
					string: "matched value",
					boolean: "matched error"
				});

				expect(result).toBeUndefined();
			});

			it("should return R | undefined for empty handlers", () => {
				const result: number | undefined = Switch<TestCases>({ boolean: false })({});

				expect(result).toBeUndefined();
			});

		});

		describe("type inference", () => {

			it("type check: should reject wrong handler parameter type", () => {
				// @ts-expect-error - handler should accept string, not number
				const result = Switch<TestCases>({ string: "test" })({
					string: (v: number) => v * 2,
					boolean: (b) => b ? "true" : "false",
					number: (n) => n.toString()
				});

				expect(result).toBeDefined();
			});

			it("type check: should reject inconsistent handler return types", () => {
				// This test verifies that all handlers should return the same type
				// When implemented, TypeScript should enforce consistent return types
				const result = Switch<TestCases>({ string: "test" })({
					boolean: 42,
					number: 10,
					// @ts-expect-error - Type 'string' is not assignable to type 'Handler<string, number>'
					string: "not a number" // This string is inconsistent with number returns
				});

				// Runtime: the matched handler returns its value
				expect(result).toBe("not a number");
			});

			it("should infer handler parameter types correctly", () => {
				const result = Switch<TestCases>({ string: "test" })({
					boolean: (b) => b ? 1 : 0, // b is inferred as boolean
					number: (n) => n * 2, // n is inferred as number
					string: (v) => v.length // v is inferred as string
				});

				// result should be number
				const typeCheck: number = result;
				expect(typeCheck).toBe(4);
			});

			it("should return R | undefined when some handlers missing", () => {
				// Missing 'number' handler, so result is string | undefined
				const result: string | undefined = Switch<TestCases>({ string: "test" })({
					string: "ok",
					boolean: "error"
				});

				expect(result).toBe("ok");
			});

			it("type check: should reject extra handler keys", () => {
				const result = Switch<TestCases>({ string: "test" })({
					string: "ok",
					boolean: "error",
					number: "other",
					// @ts-expect-error - 'extra' is not a valid key
					extra: "not allowed"
				});

				expect(result).toBe("ok");
			});

		});

		describe("fallback handlers", () => {

			it("should support fallback with custom key name", () => {
				const result: string = Switch<TestCases, "other">({ string: "test" })({
					string: "matched string",
					boolean: "matched boolean",
					number: "matched number",
					other: "fallback"
				});

				expect(result).toBe("matched string");
			});

			it("should pass union of all case types to fallback handler", () => {
				const result: string = Switch<TestCases, "default">({ number: 42 })({
					string: (v) => `string: ${v}`,
					number: (n) => `number: ${n}`,
					boolean: (b) => `boolean: ${b}`,
					default: (v) => {
						// v is string | number | boolean
						if ( typeof v === "string" ) {
							return `default string: ${v}`;
						}
						if ( typeof v === "number" ) {
							return `default number: ${v}`;
						}
						return `default boolean: ${v}`;
					}
				});

				expect(result).toBe("number: 42");
			});

			it("should support underscore as fallback key", () => {
				const result: number = Switch<TestCases, "_">({ boolean: true })({
					boolean: 1,
					string: 2,
					number: 3,
					_: 999
				});

				expect(result).toBe(1);
			});

			it("should return R (not R | undefined) with fallback", () => {
				const result: string = Switch<TestCases, "fallback">({ string: "test" }, "fallback")({
					boolean: "matched boolean",
					fallback: "default case"
					// 'string' and 'number' handlers missing, but fallback guarantees a result
				});

				expect(result).toBe("default case");
			});

			it("should handle fallback key that doesn't conflict with case keys", () => {
				type ConflictCases = {
					value: string
					other: number
				}

				// When fallback key matches a case key, types become complex/conflicting
				// Better practice: use a fallback key that doesn't match any case key
				const result: string | undefined = Switch<ConflictCases, "default">({ value: "test" })({
					value: "ok",
					default: "fallback"
				});

				expect(result).toBe("ok");
			});

			it("type check: should reject wrong type for fallback handler", () => {
				const result = Switch<TestCases, "default">({ string: "test" })({
					string: (v) => v.length,
					number: (n) => n * 2,
					boolean: (b) => b ? 1 : 0,
					// @ts-expect-error - fallback returns string but R should be number
					default: "not a number"
				});

				expect(typeof result).toBe("number");
			});

		});

		describe("mandatory fallback parameter", () => {

			it("type check: fallback parameter required when F type specified", () => {
				// ✅ Valid: Fallback parameter specified when using fallback handler
				const a = Switch<{ value: string; error: Error }, "_">({ value: "done" }, "_")({
					value: (v) => `value: ${v}`,
					_: () => "unhandled"
				});

				expect(a).toBe("value: done");
			});

			it("type check: fallback handler invalid without fallback parameter", () => {
				// ❌ Invalid: Fallback handler without fallback parameter
				const b = Switch<{ value: string; error: Error }>({ value: "done" })({
					value: (v) => `value: ${v}`,
					// @ts-expect-error - Demonstrating invalid usage: '_' is not valid without fallback parameter
					_: () => "unhandled"
				});

				expect(b).toBe("value: done");
			});

			it("type check: type parameter mismatch with runtime", () => {
				// ❌ Invalid: Fallback type parameter specified but not passed at runtime
				// @ts-expect-error - Expected 2 arguments, but got 1
				const c = Switch<{ value: string; error: Error }, "_">({ value: "done" })({
					value: (v) => `value: ${v}`,
					_: () => "unhandled"
				});

				expect(c).toBe("value: done");
			});

		});

	});

});
