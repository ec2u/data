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

import {
	batch,
	distinct,
	every,
	filter,
	find,
	flatMap,
	forEach,
	items,
	map,
	merge,
	peek,
	pipe,
	Pipe,
	range,
	reduce,
	skip,
	some,
	take,
	toArray,
	toMap,
	toSet
} from "./async";


describe("pipe()", () => {

	it("should return promise value directly", async () => {

		const value=await pipe(Promise.resolve(42));

		expect(value).toBe(42);

	});

	it("should retrieve async iterable from pipe", async () => {

		const values=await items(pipe(items(range(1, 4))))(toArray());

		expect(values).toEqual([1, 2, 3]);

	});

});

describe("Factories", () => {

	describe("range()", () => {

		it("should generate ascending range", async () => {

			const values=await range(1, 5)(toArray());

			expect(values).toEqual([1, 2, 3, 4]);

		});

		it("should generate descending range", async () => {

			const values=await range(5, 1)(toArray());

			expect(values).toEqual([5, 4, 3, 2]);

		});

		it("should generate empty range when start equals end", async () => {

			const values=await range(3, 3)(toArray());

			expect(values).toEqual([]);

		});

		it("should work with negative numbers", async () => {

			const values=await range(-2, 2)(toArray());

			expect(values).toEqual([-2, -1, 0, 1]);

		});

		describe("should create a compliant pipe object", () => {

			it("should return async iterable when called without transform", async () => {
				expect(await pipe(range(1, 4)(toArray()))).toEqual([1, 2, 3]);
			});

			it("should apply task and return new pipe", async () => {
				expect(await pipe(range(1, 4)(map(x => x*2))(toArray()))).toEqual([2, 4, 6]);
			});

			it("should apply sink and return promise", async () => {
				expect(await range(1, 4)(reduce((acc, x) => acc+x, 0))).toBe(6);
			});

			it("should chain multiple tasks", async () => {
				expect(await pipe(
					range(1, 6)
					(filter(x => x%2 === 0))
					(map(x => x*2))
					(toArray())
				)).toEqual([4, 8]);
			});

		});

	});

	describe("items()", () => {

		it("should create pipe from single value", async () => {

			const values=await items(42)(toArray());

			expect(values).toEqual([42]);

		});

		it("should create pipe from array", async () => {

			const values=await items([1, 2, 3])(toArray());

			expect(values).toEqual([1, 2, 3]);

		});

		it("should create pipe from iterable", async () => {

			const values=await items(new Set([1, 2, 3]))(toArray());

			expect(values).toEqual([1, 2, 3]);

		});

		it("should create pipe from async iterable", async () => {

			const values=await items(range(1, 4))(toArray());

			expect(values).toEqual([1, 2, 3]);

		});

		describe("should create a compliant pipe object", () => {

			it("should return async iterable when called without transform", async () => {
				expect(await pipe(items(items([1, 2, 3])())(toArray()))).toEqual([1, 2, 3]);
			});

			it("should apply task and return new pipe", async () => {
				expect(await pipe(items([1, 2, 3])(map(x => x*2))(toArray()))).toEqual([2, 4, 6]);
			});

			it("should apply sink and return promise", async () => {
				expect(await items([1, 2, 3])(reduce((acc, x) => acc+x, 0))).toBe(6);
			});

			it("should chain multiple tasks", async () => {
				expect(await pipe(
					items([1, 2, 3, 4, 5])
					(filter(x => x%2 === 0))
					(map(x => x*2))
					(toArray())
				)).toEqual([4, 8]);
			});

		});

	});

	describe("merge()", () => {

		it("should merge multiple pipes", async () => {

			const values=await merge(range(1, 3), range(10, 12))(toArray());

			expect([...values].sort((a, b) => a-b)).toEqual([1, 2, 10, 11]);

		});

		it("should handle empty pipes", async () => {

			const values=await merge(range(1, 1), range(2, 2))(toArray());

			expect(values).toEqual([]);

		});

		it("should clean up iterators on early termination", async () => {

			const cleanup: string[]=[];

			function tracked(name: string): Pipe<number> {
				return items((async function* () {
					try {
						yield 1;
						yield 2;
					} finally {
						cleanup.push(name);
					}
				})());
			}

			const merged=merge(tracked("a"), tracked("b"));
			const iterator=merged()[Symbol.asyncIterator]();

			await iterator.next();
			await iterator.return?.();

			expect(cleanup.length).toBe(2);

		});

		describe("should create a compliant pipe object", () => {

			it("should return async iterable when called without transform", async () => {
				const values=await pipe(merge(range(1, 3), range(10, 12))(toArray()));
				expect([...values].sort((a, b) => a-b)).toEqual([1, 2, 10, 11]);
			});

			it("should apply task and return new pipe", async () => {
				const values=await pipe(merge(range(1, 3), range(10, 12))(map(x => x*2))(toArray()));
				expect([...values].sort((a, b) => a-b)).toEqual([2, 4, 20, 22]);
			});

			it("should apply sink and return promise", async () => {
				expect(await merge(range(1, 3), range(10, 12))(reduce((acc, x) => acc+x, 0))).toBe(24);
			});

			it("should chain multiple tasks", async () => {
				const values=await pipe(
					merge(range(1, 4), range(10, 13))
					(filter(x => x%2 === 0))
					(map(x => x*2))
					(toArray())
				);
				expect([...values].sort((a, b) => a-b)).toEqual([4, 20, 24]);
			});

		});

	});

});

describe("Tasks", () => {

	describe("skip()", () => {

		it("should skip first n items", async () => {

			const values=await items([1, 2, 3, 4, 5])(skip(2))(toArray());

			expect(values).toEqual([3, 4, 5]);

		});

		it("should skip all items when n >= length", async () => {

			const values=await items([1, 2, 3])(skip(5))(toArray());

			expect(values).toEqual([]);

		});

		it("should skip zero items", async () => {

			const values=await items([1, 2, 3])(skip(0))(toArray());

			expect(values).toEqual([1, 2, 3]);

		});

		it("should treat negative n as zero", async () => {

			const values=await items([1, 2, 3])(skip(-5))(toArray());

			expect(values).toEqual([1, 2, 3]);

		});

	});

	describe("take()", () => {

		it("should take first n items", async () => {

			const values=await items([1, 2, 3, 4, 5])(take(3))(toArray());

			expect(values).toEqual([1, 2, 3]);

		});

		it("should take all items when n >= length", async () => {

			const values=await items([1, 2, 3])(take(5))(toArray());

			expect(values).toEqual([1, 2, 3]);

		});

		it("should take zero items", async () => {

			const values=await items([1, 2, 3])(take(0))(toArray());

			expect(values).toEqual([]);

		});

		it("should treat negative n as zero", async () => {

			const values=await items([1, 2, 3])(take(-5))(toArray());

			expect(values).toEqual([]);

		});

	});

	describe("peek()", () => {

		it("should execute side effect for each item", async () => {

			const sideEffects: number[]=[];
			const values=await items([1, 2, 3])(peek(x => {
				sideEffects.push(x*10);
			}))(toArray());

			expect(values).toEqual([1, 2, 3]);
			expect(sideEffects).toEqual([10, 20, 30]);

		});

		it("should support async consumers", async () => {

			const sideEffects: number[]=[];
			const values=await items([1, 2, 3])(peek(async x => {
				await Promise.resolve();
				sideEffects.push(x);
			}))(toArray());

			expect(values).toEqual([1, 2, 3]);
			expect(sideEffects).toEqual([1, 2, 3]);

		});

	});

	describe("filter()", () => {

		it("should filter items by predicate", async () => {

			const values=await items([1, 2, 3, 4, 5])(filter(x => x%2 === 0))(toArray());

			expect(values).toEqual([2, 4]);

		});

		it("should support async predicates", async () => {

			const values=await items([1, 2, 3, 4, 5])(filter(async x => {
				await Promise.resolve();
				return x > 2;
			}))(toArray());

			expect(values).toEqual([3, 4, 5]);

		});

		it("should handle empty results", async () => {

			const values=await items([1, 2, 3])(filter(() => false))(toArray());

			expect(values).toEqual([]);

		});

	});

	describe("distinct()", () => {

		it("should filter out duplicate primitives", async () => {

			const values=await items([1, 2, 2, 3, 1, 4])(distinct())(toArray());

			expect(values).toEqual([1, 2, 3, 4]);

		});

		it("should use selector for comparison", async () => {

			const values=await items([
				{ id: 1, name: "a" },
				{ id: 2, name: "b" },
				{ id: 1, name: "c" }
			])(distinct(item => item.id))(toArray());

			expect(values).toEqual([
				{ id: 1, name: "a" },
				{ id: 2, name: "b" }
			]);

		});

		it("should handle empty stream", async () => {

			const values=await items([] as number[])(distinct())(toArray());

			expect(values).toEqual([]);

		});

	});

	describe("map()", () => {

		it("should transform items", async () => {

			const values=await items([1, 2, 3])(map(x => x*2))(toArray());

			expect(values).toEqual([2, 4, 6]);

		});

		it("should support async mappers", async () => {

			const values=await items([1, 2, 3])(map(async x => {
				await Promise.resolve();
				return x*2;
			}))(toArray());

			expect(values).toEqual([2, 4, 6]);

		});

		it("should change item types", async () => {

			const values=await items([1, 2, 3])(map(x => `value-${x}`))(toArray());

			expect(values).toEqual(["value-1", "value-2", "value-3"]);

		});

	});

	describe("flatMap()", () => {

		it("should flatten mapped async iterables", async () => {

			const values=await items([1, 2, 3])(flatMap(async function* (x) {
				yield x;
				yield x*10;
			}))(toArray());

			expect(values).toEqual([1, 10, 2, 20, 3, 30]);

		});

		it("should handle empty iterables", async () => {

			const values=await items([1, 2, 3])(flatMap(async function* (x) {
				if ( x === 2 ) {
					yield x;
				}
			}))(toArray());

			expect(values).toEqual([2]);

		});

	});

	describe("batch()", () => {

		it("should group items into batches of specified size", async () => {

			const values=await items([1, 2, 3, 4, 5])(batch(2))(toArray());

			expect(values).toEqual([[1, 2], [3, 4], [5]]);

		});

		it("should collect all items when size is 0", async () => {

			const values=await items([1, 2, 3, 4, 5])(batch(0))(toArray());

			expect(values).toEqual([[1, 2, 3, 4, 5]]);

		});

		it("should handle empty stream", async () => {

			const values=await items([] as number[])(batch(2))(toArray());

			expect(values).toEqual([]);

		});

		it("should yield final partial batch", async () => {

			const values=await items([1, 2, 3])(batch(2))(toArray());

			expect(values).toEqual([[1, 2], [3]]);

		});

		it("should create individual batches when size is 1", async () => {

			const values=await items([1, 2, 3, 4])(batch(1))(toArray());

			expect(values).toEqual([[1], [2], [3], [4]]);

		});

		it("should process batches through pipeline", async () => {

			const result=await items([1, 2, 3, 4, 5, 6, 7])
			(batch(3))
			(map(batch => batch.reduce((sum, n) => sum+n, 0)))
			(toArray());

			expect(result).toEqual([6, 15, 7]);

		});

	});

});

describe("Sinks", () => {

	describe("reduce()", () => {

		it("should reduce with initial value", async () => {

			const sum=await items([1, 2, 3, 4])(reduce((acc, x) => acc+x, 0));

			expect(sum).toBe(10);

		});

		it("should reduce without initial value", async () => {

			const sum=await items([1, 2, 3, 4])(reduce((acc, x) => acc+x));

			expect(sum).toBe(10);

		});

		it("should return undefined for empty stream without initial", async () => {

			const result=await items([] as number[])(reduce((acc, x) => acc+x));

			expect(result).toBeUndefined();

		});

		it("should return initial for empty stream with initial", async () => {

			const result=await items([] as number[])(reduce((acc, x) => acc+x, 100));

			expect(result).toBe(100);

		});

		it("should support async reducers", async () => {

			const sum=await items([1, 2, 3])(reduce(async (acc, x) => {
				await Promise.resolve();
				return acc+x;
			}, 0));

			expect(sum).toBe(6);

		});

	});

	describe("find()", () => {

		it("should find first matching item", async () => {

			const result=await items([1, 2, 3, 4, 5])(find(x => x > 2));

			expect(result).toBe(3);

		});

		it("should return undefined when no match", async () => {

			const result=await items([1, 2, 3])(find(x => x > 10));

			expect(result).toBeUndefined();

		});

		it("should support async predicates", async () => {

			const result=await items([1, 2, 3, 4])(find(async x => {
				await Promise.resolve();
				return x === 3;
			}));

			expect(result).toBe(3);

		});

	});

	describe("some()", () => {

		it("should return true when any item matches", async () => {

			const result=await items([1, 2, 3, 4])(some(x => x > 3));

			expect(result).toBe(true);

		});

		it("should return false when no items match", async () => {

			const result=await items([1, 2, 3])(some(x => x > 10));

			expect(result).toBe(false);

		});

		it("should support async predicates", async () => {

			const result=await items([1, 2, 3])(some(async x => {
				await Promise.resolve();
				return x === 2;
			}));

			expect(result).toBe(true);

		});

	});

	describe("every()", () => {

		it("should return true when all items match", async () => {

			const result=await items([1, 2, 3, 4])(every(x => x > 0));

			expect(result).toBe(true);

		});

		it("should return false when any item doesn't match", async () => {

			const result=await items([1, 2, 3, 4])(every(x => x < 3));

			expect(result).toBe(false);

		});

		it("should support async predicates", async () => {

			const result=await items([1, 2, 3])(every(async x => {
				await Promise.resolve();
				return x > 0;
			}));

			expect(result).toBe(true);

		});

		it("should return true for empty stream", async () => {

			const result=await items([] as number[])(every(x => x > 10));

			expect(result).toBe(true);

		});

	});

	describe("toArray()", () => {

		it("should collect all items into array", async () => {

			const values=await items([1, 2, 3])(toArray());

			expect(values).toEqual([1, 2, 3]);

		});

		it("should handle empty stream", async () => {

			const values=await items([] as number[])(toArray());

			expect(values).toEqual([]);

		});

	});

	describe("toSet()", () => {

		it("should collect all items into set", async () => {

			const values=await items([1, 2, 3])(toSet());

			expect(values).toEqual(new Set([1, 2, 3]));

		});

		it("should remove duplicates", async () => {

			const values=await items([1, 2, 2, 3, 1, 4])(toSet());

			expect(values).toEqual(new Set([1, 2, 3, 4]));

		});

		it("should handle empty stream", async () => {

			const values=await items([] as number[])(toSet());

			expect(values).toEqual(new Set());

		});

		it("should preserve insertion order", async () => {

			const values=await items([3, 1, 2])(toSet());

			expect([...values]).toEqual([3, 1, 2]);

		});

	});

	describe("toMap()", () => {

		it("should collect items into map using key selector", async () => {

			const values=await items([
				{ id: 1, name: "a" },
				{ id: 2, name: "b" },
				{ id: 3, name: "c" }
			])(toMap(item => item.id));

			expect(values).toEqual(new Map([
				[1, { id: 1, name: "a" }],
				[2, { id: 2, name: "b" }],
				[3, { id: 3, name: "c" }]
			]));

		});

		it("should collect items into map using key and value selectors", async () => {

			const values=await items([
				{ id: 1, name: "a" },
				{ id: 2, name: "b" },
				{ id: 3, name: "c" }
			])(toMap(item => item.id, item => item.name));

			expect(values).toEqual(new Map([
				[1, "a"],
				[2, "b"],
				[3, "c"]
			]));

		});

		it("should support async key selectors", async () => {

			const values=await items([
				{ id: 1, name: "a" },
				{ id: 2, name: "b" }
			])(toMap(async item => {
				await Promise.resolve();
				return item.id;
			}));

			expect(values).toEqual(new Map([
				[1, { id: 1, name: "a" }],
				[2, { id: 2, name: "b" }]
			]));

		});

		it("should support async value selectors", async () => {

			const values=await items([
				{ id: 1, name: "a" },
				{ id: 2, name: "b" }
			])(toMap(
				item => item.id,
				async item => {
					await Promise.resolve();
					return item.name.toUpperCase();
				}
			));

			expect(values).toEqual(new Map([
				[1, "A"],
				[2, "B"]
			]));

		});

		it("should overwrite duplicate keys", async () => {

			const values=await items([
				{ id: 1, name: "a" },
				{ id: 2, name: "b" },
				{ id: 1, name: "c" }
			])(toMap(item => item.id, item => item.name));

			expect(values).toEqual(new Map([
				[1, "c"],
				[2, "b"]
			]));

		});

		it("should handle empty stream", async () => {

			const values=await items([] as { id: number; name: string }[])(toMap(item => item.id));

			expect(values).toEqual(new Map());

		});

		it("should preserve insertion order", async () => {

			const values=await items([3, 1, 2])(toMap(x => x));

			expect([...values.keys()]).toEqual([3, 1, 2]);

		});

	});

	describe("forEach()", () => {

		it("should execute consumer for each item", async () => {

			const sideEffects: number[]=[];

			await items([1, 2, 3])(forEach(x => {
				sideEffects.push(x);
			}));

			expect(sideEffects).toEqual([1, 2, 3]);

		});

		it("should support async consumers", async () => {

			const sideEffects: number[]=[];

			await items([1, 2, 3])(forEach(async x => {
				await Promise.resolve();
				sideEffects.push(x*2);
			}));

			expect(sideEffects).toEqual([2, 4, 6]);

		});

		it("should handle empty stream", async () => {

			const sideEffects: number[]=[];

			await items([] as number[])(forEach(x => {
				sideEffects.push(x);
			}));

			expect(sideEffects).toEqual([]);

		});

	});

});
