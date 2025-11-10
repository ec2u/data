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
import { Condition, Status } from "./status";


describe("Status", () => {

	/**
	 * Test type used throughout the runtime behavior tests.
	 * Represents a common pattern of operation states: value, error, or loading.
	 */
	type TestCases = {
		value: string
		error: Error
		loading: boolean
	}

	describe("runtime behavior", () => {

		describe("complete handlers", () => {

			it("should handle all cases with function handlers", () => {
				const result = Status<TestCases>({ value: "success" })({
					value: (v) => `Value: ${v}`,
					error: (e) => `Error: ${e.message}`,
					loading: (l) => `Loading: ${l}`
				});

				expect(result).toBe("Value: success");
			});

			it("should handle all cases with constant handlers", () => {
				const result = Status<TestCases>({ error: new Error("failed") })({
					value: 1,
					error: 2,
					loading: 3
				});

				expect(result).toBe(2);
			});

			it("should handle mixed function and constant handlers", () => {
				const result = Status<TestCases>({ loading: true })({
					value: (v) => v.length,
					error: 0,
					loading: (l) => l ? 100 : 0
				});

				expect(result).toBe(100);
			});

			it("should correctly pass the active case value to handler", () => {
				const testError = new Error("test error");
				const result = Status<TestCases>({ error: testError })({
					value: (v) => `value: ${v}`,
					error: (e) => e.message,
					loading: (l) => `loading: ${l}`
				});

				expect(result).toBe("test error");
			});

		});

		describe("partial handlers without fallback", () => {

			it("should return handler result when case matches", () => {
				const result = Status<TestCases>({ value: "done" })({
					value: "matched",
					error: "error matched"
				});

				expect(result).toBe("matched");
			});

			it("should return undefined when case does not match any handler", () => {
				const result = Status<TestCases>({ loading: true })({
					value: "value matched",
					error: "error matched"
				});

				expect(result).toBeUndefined();
			});

			it("should return undefined with empty handlers object", () => {
				const result = Status<TestCases>({ value: "test" })({});

				expect(result).toBeUndefined();
			});

			it("should handle function handlers in partial mode", () => {
				const result = Status<TestCases>({ error: new Error("oops") })({
					error: (e) => `Error occurred: ${e.message}`
				});

				expect(result).toBe("Error occurred: oops");
			});

		});

		describe("partial handlers with fallback", () => {

			it("should use specific handler when case matches", () => {
				const result = Status<TestCases>({ value: "hello" })({
					value: "specific handler"
				}, "fallback handler");

				expect(result).toBe("specific handler");
			});

			it("should use fallback when case does not match any specific handler", () => {
				const result = Status<TestCases>({ loading: false })({
					value: "value handler"
				}, "fallback handler");

				expect(result).toBe("fallback handler");
			});

			it("should pass value to fallback function handler", () => {
				const result = Status<TestCases>({ error: new Error("fail") })({
					value: (v) => `value: ${v}`
				}, (v) => {
					if ( v instanceof Error ) {
						return `fallback error: ${v.message}`;
					}
					return `fallback: ${v}`;
				});

				expect(result).toBe("fallback error: fail");
			});

			it("should use constant fallback handler", () => {
				const result = Status<TestCases>({ loading: true })({}, 999);

				expect(result).toBe(999);
			});

			it("should prefer specific handler over fallback", () => {
				const result = Status<TestCases>({ value: "test" })({
					value: "specific",
					error: "error",
					loading: "loading"
				}, "fallback");

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
				const result = Status<MixedCases>({ string: "hello" })({
					string: (v) => v.toUpperCase(),
					number: (n) => n.toString(),
					boolean: (b) => b.toString(),
					object: (o) => o.name,
					array: (a) => a.join(",")
				});

				expect(result).toBe("HELLO");
			});

			it("should handle number values", () => {
				const result = Status<MixedCases>({ number: 42 })({
					string: (v) => v.length,
					number: (n) => n*2,
					boolean: (b) => b ? 1 : 0,
					object: (o) => o.id,
					array: (a) => a.length
				});

				expect(result).toBe(84);
			});

			it("should handle boolean values", () => {
				const result = Status<MixedCases>({ boolean: true })({
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
				const result = Status<MixedCases>({ object: obj })({
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
				const result = Status<MixedCases>({ array: arr })({
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
				const pending = Status<AsyncResult<string>>({ pending: undefined })({
					pending: "Loading...",
					success: (data) => `Success: ${data}`,
					failure: (err) => `Error: ${err.message}`
				});

				const success = Status<AsyncResult<string>>({ success: "data loaded" })({
					pending: "Loading...",
					success: (data) => `Success: ${data}`,
					failure: (err) => `Error: ${err.message}`
				});

				const failure = Status<AsyncResult<string>>({ failure: new Error("network error") })({
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
				const ok = Status<HttpStatus>({ ok: { data: "response" } })({
					ok: (res) => res.data,
					notFound: (err) => `Not found: ${err.path}`,
					serverError: (err) => `Server error: ${err.code}`
				});

				const notFound = Status<HttpStatus>({ notFound: { path: "/api/users" } })({
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
				const result = Status<FormState>({ editing: { value: "text" } })({
					submitted: (s) => `Submitted with id: ${s.id}`
				}, "Form is not submitted");

				expect(result).toBe("Form is not submitted");
			});

		});

		describe("undefined values", () => {

			type OptionCases = {
				some: string
				none: undefined
			}

			it("should handle undefined as a valid case value", () => {
				const result = Status<OptionCases>({ none: undefined })({
					some: (v) => `Value: ${v}`,
					none: "No value"
				});

				expect(result).toBe("No value");
			});

			it("should distinguish undefined from missing property", () => {
				const result = Status<OptionCases>({ none: undefined })({
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
				const result = Status<EdgeCases>({ zero: 0 })({
					zero: (n) => `zero: ${n}`,
					emptyString: "empty",
					falseBool: "false",
					nullValue: "null"
				});

				expect(result).toBe("zero: 0");
			});

			it("should handle empty string as a value", () => {
				const result = Status<EdgeCases>({ emptyString: "" })({
					zero: "zero",
					emptyString: (s) => `empty: ${s}`,
					falseBool: "false",
					nullValue: "null"
				});

				expect(result).toBe("empty: ");
			});

			it("should handle false as a value", () => {
				const result = Status<EdgeCases>({ falseBool: false })({
					zero: "zero",
					emptyString: "empty",
					falseBool: (b) => `false: ${b}`,
					nullValue: "null"
				});

				expect(result).toBe("false: false");
			});

			it("should handle null as a value", () => {
				const result = Status<EdgeCases>({ nullValue: null })({
					zero: "zero",
					emptyString: "empty",
					falseBool: "false",
					nullValue: (n) => `null: ${n}`
				});

				expect(result).toBe("null: null");
			});

		});

	}); // end runtime behavior

	/**
	 * Type system validation tests.
	 *
	 * These tests verify TypeScript's compile-time type checking behavior.
	 * Tests marked with @ts-expect-error should fail compilation, demonstrating
	 * that the type system prevents invalid usage. Runtime assertions are secondary
	 * and only ensure the test file remains valid JavaScript.
	 */
	describe("type system", () => {

		type TestCases = {
			boolean: boolean
			string: string
			number: number
		}

		describe("Condition type - ExactlyOne constraint", () => {

			it("should accept exactly one property", () => {
				// These assignments verify Condition<C> accepts single properties
				const singleString: Condition<TestCases> = { string: "test" };
				const singleBoolean: Condition<TestCases> = { boolean: true };
				const singleNumber: Condition<TestCases> = { number: 42 };

				// Runtime verification
				expect(singleString).toEqual({ string: "test" });
				expect(singleBoolean).toEqual({ boolean: true });
				expect(singleNumber).toEqual({ number: 42 });
			});

			it("type check: should reject multiple properties", () => {
				// ⚠️ This test verifies COMPILE-TIME behavior only
				// TypeScript will error on the next line, preventing invalid code
				// The runtime assertion just ensures the test file remains valid
				// @ts-expect-error - cannot have two properties
				const multipleProps: Condition<TestCases> = { string: "test", boolean: true };

				// Runtime check is secondary
				expect(multipleProps).toBeDefined();
			});

			it("type check: should reject empty object", () => {
				// ⚠️ This test verifies COMPILE-TIME behavior only
				// @ts-expect-error - must have exactly one property
				const emptyObj: Condition<TestCases> = {};

				// Runtime check is secondary
				expect(emptyObj).toBeDefined();
			});

		});

		describe("Fallback type constraints", () => {

			it("type check: fallback accepts handler value", () => {
				// ✅ Valid: fallback as handler
				const singleProp = Status<TestCases>({ string: "test" })({
					string: "ok"
				}, "default");

				expect(singleProp).toBe("ok");
			});





		});

		describe("Handler type inference", () => {

			it("type check: should reject wrong handler parameter type", () => {
				// @ts-expect-error - handler should accept string, not number
				const result = Status<TestCases>({ string: "test" })({
					string: (v: number) => v*2,
					boolean: (b) => b ? "true" : "false",
					number: (n) => n.toString()
				});

				expect(result).toBeDefined();
			});

			it("type check: should reject inconsistent handler return types", () => {
				// This test verifies that all handlers should return the same type
				// When implemented, TypeScript should enforce consistent return types
				const result = Status<TestCases>({ string: "test" })({
					boolean: 42,
					number: 10,
					// @ts-expect-error - Type 'string' is not assignable to type 'Handler<string, number>'
					string: "not a number" // This string is inconsistent with number returns
				});

				// Runtime: the matched handler returns its value
				expect(result).toBe("not a number");
			});

			it("should infer handler parameter types correctly", () => {
				const result = Status<TestCases>({ string: "test" })({
					boolean: (b) => b ? 1 : 0, // b is inferred as boolean
					number: (n) => n*2, // n is inferred as number
					string: (v) => v.length // v is inferred as string
				});

				// result should be number
				const typeCheck: number = result;
				expect(typeCheck).toBe(4);
			});

			it("should return R | undefined when some handlers missing", () => {
				// Missing 'number' handler, so result is string | undefined
				const result: string | undefined = Status<TestCases>({ string: "test" })({
					string: "ok",
					boolean: "error"
				});

				expect(result).toBe("ok");
			});

			it("type check: should reject extra handler keys", () => {
				const result = Status<TestCases>({ string: "test" })({
					string: "ok",
					boolean: "error",
					number: "other",
					// @ts-expect-error - 'extra' is not a valid key
					extra: "not allowed"
				});

				expect(result).toBe("ok");
			});

		});

		describe("Fallback handler type behavior", () => {

			it("should support fallback handler", () => {
				const result: string = Status<TestCases>({ string: "test" })({
					string: "matched string",
					boolean: "matched boolean",
					number: "matched number"
				}, "fallback");

				expect(result).toBe("matched string");
			});

			it("should pass union of all case types to fallback handler", () => {
				const result: string = Status<TestCases>({ number: 42 })({
					string: (v) => `string: ${v}`,
					number: (n) => `number: ${n}`,
					boolean: (b) => `boolean: ${b}`
				}, (v) => {
					// v is string | number | boolean
					if ( typeof v === "string" ) {
						return `default string: ${v}`;
					}
					if ( typeof v === "number" ) {
						return `default number: ${v}`;
					}
					return `default boolean: ${v}`;
				});

				expect(result).toBe("number: 42");
			});

			it("should support constant fallback value", () => {
				const result: number = Status<TestCases>({ boolean: true })({
					boolean: 1,
					string: 2,
					number: 3
				}, 999);

				expect(result).toBe(1);
			});

			it("should return R (not R | undefined) with fallback", () => {
				const result: string = Status<TestCases>({ string: "test" })({
					boolean: "matched boolean"
					// 'string' and 'number' handlers missing, but fallback guarantees a result
				}, "default case");

				expect(result).toBe("default case");
			});


			it("type check: should reject wrong type for fallback handler", () => {
				const result = Status<TestCases>({ string: "test" })({
					string: (v) => v.length,
						number: (n) => n*2,
					boolean: (b) => b ? 1 : 0
					},
					// @ts-expect-error - fallback returns string but R should be number
					"not a number"
				);

				expect(typeof result).toBe("number");
			});

		});

		describe("Fallback parameter requirements", () => {

			it("type check: fallback parameter can be specified", () => {
				// ✅ Valid: Fallback parameter specified
				const a = Status<{ value: string; error: Error }>({ value: "done" })({
					value: (v) => `value: ${v}`
				}, () => "unhandled");

				expect(a).toBe("value: done");
			});

		});

	});

});
