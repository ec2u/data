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
import { Memo, pipe } from "@/utilities/core/pipe";

describe("pipe()", () => {

	let cache: Cache<Memo>;
	let counter: Record<string, number>;

	beforeEach(() => {
		cache=HeapCache<Memo>();
		counter={};
	});


	function track(name: string): void {
		counter[name]=(counter[name] || 0) + 1;
	}

	describe("task()", () => {

		it("executes simple pipeline", async () => {
			const result=await pipe("hello", { label: "test", cache })
				.task(function process(data) {
					track("process");
					return data.toUpperCase();
				});

			expect(result).toBe("HELLO");
			expect(counter.process).toBe(1);
		});

		it("handles promise input", async () => {
			const result=await pipe(Promise.resolve("async"), { label: "test", cache })
				.task(function process(data) {
					track("process");
					return data + "-processed";
				});

			expect(result).toBe("async-processed");
			expect(counter.process).toBe(1);
		});

		it("does not cache anonymous functions", async () => {
			const result1=await pipe("test", { label: "test", cache })
				.task((data) => {
					track("anon");
					return data + "-1";
				});

			const result2=await pipe("test", { label: "test", cache })
				.task((data) => {
					track("anon");
					return data + "-2";
				});

			expect(result1).toBe("test-1");
			expect(result2).toBe("test-2");
			expect(counter.anon).toBe(2);
		});

		it("caches named function results", async () => {
			const result1=await pipe("input", { label: "test", cache })
				.task(function transform(data) {
					track("transform");
					return data + "-transformed";
				});

			const result2=await pipe("input", { label: "test", cache })
				.task(function transform(data) {
					track("transform");
					return data + "-transformed";
				});

			expect(result1).toBe("input-transformed");
			expect(result2).toBe("input-transformed");
			expect(counter.transform).toBe(1);
		});

		it("caches based on input data", async () => {
			await pipe("input1", { label: "test", cache })
				.task(function transform(data) {
					track("t1");
					return data + "-transformed";
				});

			await pipe("input2", { label: "test", cache })
				.task(function transform(data) {
					track("t2");
					return data + "-transformed";
				});

			expect(counter.t1).toBe(1);
			expect(counter.t2).toBe(1);
		});

		it("caches based on pipeline label", async () => {
			await pipe("input", { label: "p1", cache })
				.task(function transform(data) {
					track("p1");
					return data + "-1";
				});

			await pipe("input", { label: "p2", cache })
				.task(function transform(data) {
					track("p2");
					return data + "-2";
				});

			expect(counter.p1).toBe(1);
			expect(counter.p2).toBe(1);
		});

		it("caches multi-step pipeline", async () => {
			const result1=await pipe("start", { label: "multi", cache })
				.task(function step1(data) {
					track("s1");
					return data + "-1";
				})
				.task(function step2(data) {
					track("s2");
					return data + "-2";
				});

			const result2=await pipe("start", { label: "multi", cache })
				.task(function step1(data) {
					track("s1");
					return data + "-1";
				})
				.task(function step2(data) {
					track("s2");
					return data + "-2";
				});

			expect(result1).toBe("start-1-2");
			expect(result2).toBe("start-1-2");
			expect(counter.s1).toBe(1);
			expect(counter.s2).toBe(1);
		});

		it("reuses cached intermediate results", async () => {
			await pipe("input", { label: "partial", cache })
				.task(function step1(data) {
					track("s1");
					return data + "-1";
				})
				.task(function step2(data) {
					track("s2");
					return data + "-2";
				});

			const result=await pipe("input", { label: "partial", cache })
				.task(function step1(data) {
					track("s1");
					return data + "-1";
				})
				.task(function step3(data) {
					track("s3");
					return data + "-3";
				});

			expect(result).toBe("input-1-3");
			expect(counter.s1).toBe(1);
			expect(counter.s2).toBe(1);
			expect(counter.s3).toBe(1);
		});

		it("supports catch method", async () => {
			const result=await pipe("test", { label: "catch", cache })
				.task(function fail() {
					track("fail");
					throw new Error("Test error");
				})
				.catch((error) => {
					track("catch");
					return "recovered-" + error.message;
				});

			expect(result).toBe("recovered-Test error");
			expect(counter.fail).toBe(1);
			expect(counter.catch).toBe(1);
		});

		it("supports finally method", async () => {
			let finallyCalled=false;

			const result=await pipe("test", { label: "finally", cache })
				.task(function process(data) {
					track("process");
					return data + "-processed";
				})
				.finally(() => {
					finallyCalled=true;
				});

			expect(result).toBe("test-processed");
			expect(finallyCalled).toBe(true);
			expect(counter.process).toBe(1);
		});

		it("handles sync errors", async () => {
			try {
				await pipe("test", { label: "error", cache })
					.task(function fail() {
						track("fail");
						throw new Error("Sync error");
					});
				fail("Expected error");
			} catch ( error ) {
				expect((error as Error).message).toBe("Sync error");
				expect(counter.fail).toBe(1);
			}
		});

		it("handles async errors", async () => {
			try {
				await pipe("test", { label: "error", cache })
					.task(async function fail() {
						track("fail");
						await new Promise(resolve => setTimeout(resolve, 1));
						throw new Error("Async error");
					});
				fail("Expected error");
			} catch ( error ) {
				expect((error as Error).message).toBe("Async error");
				expect(counter.fail).toBe(1);
			}
		});

		it("does not cache failed operations", async () => {
			let shouldFail=true;

			try {
				await pipe("test", { label: "retry", cache })
					.task(function conditionalFail() {
						track("fail");
						if ( shouldFail ) {
							throw new Error("First fails");
						}
						return "success";
					});
				fail("Expected first to fail");
			} catch ( error ) {
				expect((error as Error).message).toBe("First fails");
			}

			shouldFail=false;
			const result=await pipe("test", { label: "retry", cache })
				.task(function conditionalFail() {
					track("fail");
					if ( shouldFail ) {
						throw new Error("First fails");
					}
					return "success";
				});

			expect(result).toBe("success");
			expect(counter.fail).toBe(2);
		});

		it("handles null and undefined", async () => {
			const nullResult=await pipe(null, { label: "null", cache })
				.task(function processNull(data) {
					track("null");
					return data === null ? "was-null" : "not-null";
				});

			const undefinedResult=await pipe(undefined, { label: "undefined", cache })
				.task(function processUndefined(data) {
					track("undefined");
					return data === undefined ? "was-undefined" : "not-undefined";
				});

			expect(nullResult).toBe("was-null");
			expect(undefinedResult).toBe("was-undefined");
			expect(counter.null).toBe(1);
			expect(counter.undefined).toBe(1);
		});

		it("handles complex objects", async () => {
			const data={
				array: [1, 2, { nested: true }],
				object: { deep: { value: "test" } },
				number: 42
			};

			const result=await pipe(data, { label: "complex", cache })
				.task(function process(data) {
					track("complex");
					return { ...data, processed: true };
				});

			expect(result.processed).toBe(true);
			expect(result.array).toEqual([1, 2, { nested: true }]);
			expect(counter.complex).toBe(1);

			await pipe(data, { label: "complex", cache })
				.task(function process(data) {
					track("complex");
					return { ...data, processed: true };
				});

			expect(counter.complex).toBe(1);
		});

	});

	describe("then()", () => {

		it("executes simple pipeline without caching", async () => {
			const result=await pipe("hello", { label: "test", cache })
				.then(function process(data) {
					track("process");
					return data.toUpperCase();
				});

			expect(result).toBe("HELLO");
			expect(counter.process).toBe(1);
		});

		it("never caches named functions", async () => {
			const transform=function transform(data: string) {
				track("transform");
				return data + "-transformed";
			};

			const [result1, result2]=await Promise.all([
				pipe("input", { label: "test", cache }).then(transform),
				pipe("input", { label: "test", cache }).then(transform)
			]);

			expect(result1).toBe("input-transformed");
			expect(result2).toBe("input-transformed");
			expect(counter.transform).toBe(2);
		});

		it("never caches multi-step pipelines", async () => {
			const createPipeline=() => pipe("start", { label: "multi", cache })
				.then(function step1(data) {
					track("s1");
					return data + "-1";
				})
				.then(function step2(data) {
					track("s2");
					return data + "-2";
				});

			const [result1, result2]=await Promise.all([
				createPipeline(),
				createPipeline()
			]);

			expect(result1).toBe("start-1-2");
			expect(result2).toBe("start-1-2");
			expect(counter.s1).toBe(2);
			expect(counter.s2).toBe(2);
		});

		it("never caches despite same input and label", async () => {
			const transform=function transform(data: string) {
				track("t1");
				return data + "-transformed";
			};

			await Promise.all([
				pipe("input", { label: "same", cache }).then(transform),
				pipe("input", { label: "same", cache }).then(transform)
			]);

			expect(counter.t1).toBe(2);
		});

		it("mixes with cached task() method", async () => {
			const createMixedPipeline=() => pipe("start", { label: "mixed", cache })
				.task(function cachedStep(data) {
					track("cached");
					return data + "-cached";
				})
				.then(function uncachedStep(data) {
					track("uncached");
					return data + "-uncached";
				});

			const result1=await createMixedPipeline();
			const result2=await createMixedPipeline();

			expect(result1).toBe("start-cached-uncached");
			expect(result2).toBe("start-cached-uncached");
			expect(counter.cached).toBe(1);
			expect(counter.uncached).toBe(2);
		});

	});


});
