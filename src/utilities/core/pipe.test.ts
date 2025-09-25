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

import { Cache, HeapCache } from "@/utilities/core/cache";
import { Artifact, pipe } from "@/utilities/core/pipe";


describe("pipe()", () => {

	let cache: Cache<Artifact>;
	let executionCounter: Record<string, number>;

	beforeEach(() => {
		cache=HeapCache<Artifact>();
		executionCounter={};
	});

	function trackExecution(name: string): void {
		executionCounter[name]=(executionCounter[name] || 0) + 1;
	}

	describe("basic functionality", () => {

		it("should execute a simple pipeline", async () => {

			const result=await pipe("hello", { label: "test", cache })
				.then(function process(data) {
					trackExecution("process");
					return data.toUpperCase();
				});

			expect(result).toBe("HELLO");
			expect(executionCounter.process).toBe(1);
		});

		it("should handle promise input", async () => {

			const result=await pipe(Promise.resolve("async"), { label: "test", cache })
				.then(function process(data) {
					trackExecution("process");
					return data + "-processed";
				});

			expect(result).toBe("async-processed");
			expect(executionCounter.process).toBe(1);
		});

		it("should handle anonymous functions without caching", async () => {

			const result1=await pipe("test", { label: "test", cache })
				.then((data) => {
					trackExecution("anonymous");
					return data + "-1";
				});

			const result2=await pipe("test", { label: "test", cache })
				.then((data) => {
					trackExecution("anonymous");
					return data + "-2";
				});

			expect(result1).toBe("test-1");
			expect(result2).toBe("test-2");
			expect(executionCounter.anonymous).toBe(2);
		});
	});

	describe("caching behavior", () => {

		it("should cache named function results", async () => {

			const result1=await pipe("input", { label: "cache-test", cache })
				.then(function transform(data) {
					trackExecution("transform");
					return data + "-transformed";
				});

			const result2=await pipe("input", { label: "cache-test", cache })
				.then(function transform(data) {
					trackExecution("transform");
					return data + "-transformed";
				});

			expect(result1).toBe("input-transformed");
			expect(result2).toBe("input-transformed");
			expect(executionCounter.transform).toBe(1);
		});

		it("should cache based on input data", async () => {

			await pipe("input1", { label: "cache-test", cache })
				.then(function transform(data) {
					trackExecution("transform-1");
					return data + "-transformed";
				});

			await pipe("input2", { label: "cache-test", cache })
				.then(function transform(data) {
					trackExecution("transform-2");
					return data + "-transformed";
				});

			expect(executionCounter["transform-1"]).toBe(1);
			expect(executionCounter["transform-2"]).toBe(1);
		});

		it("should cache based on pipeline label", async () => {

			await pipe("input", { label: "pipeline1", cache })
				.then(function transform(data) {
					trackExecution("pipeline1-transform");
					return data + "-1";
				});

			await pipe("input", { label: "pipeline2", cache })
				.then(function transform(data) {
					trackExecution("pipeline2-transform");
					return data + "-2";
				});

			expect(executionCounter["pipeline1-transform"]).toBe(1);
			expect(executionCounter["pipeline2-transform"]).toBe(1);
		});
	});

	describe("multi-step caching", () => {

		it("should cache each step independently", async () => {

			const result1=await pipe("start", { label: "multi-step", cache })
				.then(function step1(data) {
					trackExecution("step1");
					return data + "-1";
				})
				.then(function step2(data) {
					trackExecution("step2");
					return data + "-2";
				})
				.then(function step3(data) {
					trackExecution("step3");
					return data + "-3";
				});

			const result2=await pipe("start", { label: "multi-step", cache })
				.then(function step1(data) {
					trackExecution("step1");
					return data + "-1";
				})
				.then(function step2(data) {
					trackExecution("step2");
					return data + "-2";
				})
				.then(function step3(data) {
					trackExecution("step3");
					return data + "-3";
				});

			expect(result1).toBe("start-1-2-3");
			expect(result2).toBe("start-1-2-3");
			expect(executionCounter.step1).toBe(1);
			expect(executionCounter.step2).toBe(1);
			expect(executionCounter.step3).toBe(1);
		});

		it("should reuse cached intermediate results", async () => {

			await pipe("input", { label: "partial", cache })
				.then(function step1(data) {
					trackExecution("step1");
					return data + "-step1";
				})
				.then(function step2(data) {
					trackExecution("step2");
					return data + "-step2";
				});

			const result=await pipe("input", { label: "partial", cache })
				.then(function step1(data) {
					trackExecution("step1");
					return data + "-step1";
				})
				.then(function step3(data) {
					trackExecution("step3");
					return data + "-step3";
				});

			expect(result).toBe("input-step1-step3");
			expect(executionCounter.step1).toBe(1);
			expect(executionCounter.step2).toBe(1);
			expect(executionCounter.step3).toBe(1);
		});

		it("should handle mixed named and anonymous functions", async () => {

			const result=await pipe("mixed", { label: "mixed-test", cache })
				.then(function namedStep(data) {
					trackExecution("namedStep");
					return data + "-named";
				})
				.then((data) => {
					trackExecution("anonymous");
					return data + "-anon";
				})
				.then(function finalStep(data) {
					trackExecution("finalStep");
					return data + "-final";
				});

			expect(result).toBe("mixed-named-anon-final");
			expect(executionCounter.namedStep).toBe(1);
			expect(executionCounter.anonymous).toBe(1);
			expect(executionCounter.finalStep).toBe(1);

			await pipe("mixed", { label: "mixed-test", cache })
				.then(function namedStep(data) {
					trackExecution("namedStep");
					return data + "-named";
				})
				.then((data) => {
					trackExecution("anonymous");
					return data + "-anon";
				})
				.then(function finalStep(data) {
					trackExecution("finalStep");
					return data + "-final";
				});

			expect(executionCounter.namedStep).toBe(1);
			expect(executionCounter.anonymous).toBe(2);
			expect(executionCounter.finalStep).toBe(1);
		});
	});

	describe("promise methods", () => {

		it("should support catch method", async () => {

			const result=await pipe("test", { label: "catch-test", cache })
				.then(function failingStep() {
					trackExecution("failingStep");
					throw new Error("Test error");
				})
				.catch((error) => {
					trackExecution("errorHandler");
					return "recovered-" + error.message;
				});

			expect(result).toBe("recovered-Test error");
			expect(executionCounter.failingStep).toBe(1);
			expect(executionCounter.errorHandler).toBe(1);
		});

		it("should support finally method", async () => {

			let finallyCalled=false;

			const result=await pipe("test", { label: "finally-test", cache })
				.then(function process(data) {
					trackExecution("process");
					return data + "-processed";
				})
				.finally(() => {
					finallyCalled=true;
				});

			expect(result).toBe("test-processed");
			expect(finallyCalled).toBe(true);
			expect(executionCounter.process).toBe(1);
		});
	});

	describe("error handling", () => {

		it("should handle synchronous errors in steps", async () => {

			try {
				await pipe("test", { label: "sync-error", cache })
					.then(function faultyStep() {
						trackExecution("faultyStep");
						throw new Error("Synchronous error");
					});

				fail("Expected error to be thrown");
			} catch ( error ) {
				expect((error as Error).message).toBe("Synchronous error");
				expect(executionCounter.faultyStep).toBe(1);
			}
		});

		it("should handle asynchronous errors in steps", async () => {

			try {
				await pipe("test", { label: "async-error", cache })
					.then(async function faultyAsyncStep() {
						trackExecution("faultyAsyncStep");
						await new Promise(resolve => setTimeout(resolve, 1));
						throw new Error("Asynchronous error");
					});

				fail("Expected error to be thrown");
			} catch ( error ) {
				expect((error as Error).message).toBe("Asynchronous error");
				expect(executionCounter.faultyAsyncStep).toBe(1);
			}
		});

		it("should handle errors in JSON serialization", async () => {

			try {
				await pipe("input", { label: "circular-test", cache })
					.then(function processCircular(data) {
						trackExecution("processCircular");
						const circularObj: any={ name: "circular" };
						circularObj.self=circularObj;
						return circularObj;
					});

				fail("Expected error to be thrown");
			} catch ( error ) {
				expect((error as Error).message).toContain("circular");
				expect(executionCounter.processCircular).toBe(1);
			}
		});

		it("should not cache failed operations", async () => {

			let shouldFail=true;

			try {
				await pipe("test", { label: "retry-test", cache })
					.then(function conditionalFail() {
						trackExecution("conditionalFail");
						if ( shouldFail ) {
							throw new Error("First attempt fails");
						}
						return "success";
					});

				fail("Expected first attempt to fail");
			} catch ( error ) {
				expect((error as Error).message).toBe("First attempt fails");
			}

			shouldFail=false;

			const result=await pipe("test", { label: "retry-test", cache })
				.then(function conditionalFail() {
					trackExecution("conditionalFail");
					if ( shouldFail ) {
						throw new Error("First attempt fails");
					}
					return "success";
				});

			expect(result).toBe("success");
			expect(executionCounter.conditionalFail).toBe(2);
		});
	});

	describe("data types and edge cases", () => {

		it("should handle null and undefined values", async () => {

			const nullResult=await pipe(null, { label: "null-test", cache })
				.then(function processNull(data) {
					trackExecution("processNull");
					return data === null ? "was-null" : "not-null";
				});

			const undefinedResult=await pipe(undefined, { label: "undefined-test", cache })
				.then(function processUndefined(data) {
					trackExecution("processUndefined");
					return data === undefined ? "was-undefined" : "not-undefined";
				});

			expect(nullResult).toBe("was-null");
			expect(undefinedResult).toBe("was-undefined");
			expect(executionCounter.processNull).toBe(1);
			expect(executionCounter.processUndefined).toBe(1);
		});

		it("should handle complex objects", async () => {

			const complexData={
				array: [1, 2, { nested: true }],
				object: { deep: { very: { deep: "value" } } },
				number: 42,
				boolean: false
			};

			const result=await pipe(complexData, { label: "complex-test", cache })
				.then(function processComplex(data) {
					trackExecution("processComplex");
					return { ...data, processed: true };
				});

			expect(result.processed).toBe(true);
			expect(result.array).toEqual([1, 2, { nested: true }]);
			expect(executionCounter.processComplex).toBe(1);

			await pipe(complexData, { label: "complex-test", cache })
				.then(function processComplex(data) {
					trackExecution("processComplex");
					return { ...data, processed: true };
				});

			expect(executionCounter.processComplex).toBe(1);
		});

		it("should handle functions with same name but different implementations", async () => {

			const pipeline1=pipe("test", { label: "same-name-1", cache })
				.then(function transform(data) {
					trackExecution("transform-impl1");
					return data + "-impl1";
				});

			const pipeline2=pipe("test", { label: "same-name-2", cache })
				.then(function transform(data) {
					trackExecution("transform-impl2");
					return data + "-impl2";
				});

			const [result1, result2]=await Promise.all([pipeline1, pipeline2]);

			expect(result1).toBe("test-impl1");
			expect(result2).toBe("test-impl2");
			expect(executionCounter["transform-impl1"]).toBe(1);
			expect(executionCounter["transform-impl2"]).toBe(1);
		});
	});

});
