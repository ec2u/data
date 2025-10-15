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
	process,
	range,
	reduce,
	skip,
	some,
	take,
	toArray
} from "./async"; // !!! import *


// !!! remove

async function collectArray<T>(source: AsyncIterable<T>): Promise<T[]> {
	const result: T[]=[];
	for await (const item of source) {
		result.push(item);
	}
	return result;
}


//// Drivers ///////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("process()", () => {

	// !!! test Promise<T

	it("should consume async iterable without collecting", async () => {

		const sideEffects: number[]=[];
		const source=items(range(1, 4))(peek(n => {
			sideEffects.push(n);
		}));

		await process(source);

		expect(sideEffects).toEqual([1, 2, 3]);

	});

	it("should consume pipe without collecting", async () => {

		const sideEffects: number[]=[];

		await process(items(range(1, 4))(peek(n => {
			sideEffects.push(n);
		})));

		expect(sideEffects).toEqual([1, 2, 3]);

	});

});

describe("collect()", () => {

	it("should return promise value directly", async () => {

		const value=await pipe(Promise.resolve(42));

		expect(value).toBe(42);

	});

	it("should collect items from async iterable", async () => {

		const values=await pipe(range(1, 4));

		expect(values).toEqual([1, 2, 3]);

	});

	it("should collect items from pipe", async () => {

		const values=await pipe(items(range(1, 4)));

		expect(values).toEqual([1, 2, 3]);

	});

});


//// Factories /////////////////////////////////////////////////////////////////////////////////////////////////////////

// !!! range()

describe("stream()", () => {

	it("should create pipe from single value", async () => {

		const values=await pipe(items(42));

		expect(values).toEqual([42]);

	});

	it("should create pipe from array", async () => {

		const values=await pipe(items([1, 2, 3]));

		expect(values).toEqual([1, 2, 3]);

	});

	it("should create pipe from iterable", async () => {

		const values=await pipe(items(new Set([1, 2, 3])));

		expect(values).toEqual([1, 2, 3]);

	});

	it("should create pipe from async iterable", async () => {

		const values=await pipe(items(range(1, 4)));

		expect(values).toEqual([1, 2, 3]);

	});

	it("should return async iterable when called without transform", async () => {

		const iterable=items([1, 2, 3])();
		const values=await collectArray(iterable);

		expect(values).toEqual([1, 2, 3]);

	});

	it("should apply task and return new pipe", async () => {

		const values=await pipe(items([1, 2, 3])(map(x => x*2)));

		expect(values).toEqual([2, 4, 6]);

	});

	it("should apply sink and return promise", async () => {

		const sum=await items([1, 2, 3])(reduce((acc, x) => acc+x, 0));

		expect(sum).toBe(6);

	});

	it("should chain multiple tasks", async () => {

		const values=await pipe(
			items([1, 2, 3, 4, 5])
			(filter(x => x%2 === 0))
			(map(x => x*2))
		);

		expect(values).toEqual([4, 8]);

	});

});

describe("merge()", () => {

	it("should merge multiple async iterables", async () => {

		const source1=range(1, 3);
		const source2=range(10, 12);
		const merged=merge(source1, source2);
		const values=(await collectArray(merged)).sort();

		expect(values).toEqual([1, 2, 10, 11]);

	});

	it("should merge multiple pipes", async () => {

		const values=await pipe(
			merge(
				items(range(1, 3)),
				items(range(10, 12))
			)
		);

		expect([...values].sort()).toEqual([1, 2, 10, 11]);

	});

	it("should handle empty sources", async () => {

		const merged=merge(range(1, 1), range(2, 2));
		const values=await collectArray(merged);

		expect(values).toEqual([]);

	});

	it("should clean up iterators on early termination", async () => {

		const cleanup: string[]=[];

		async function* tracked(name: string): AsyncIterable<number> {
			try {
				yield 1;
				yield 2;
			} finally {
				cleanup.push(name);
			}
		}

		const merged=merge(tracked("a"), tracked("b"));
		const iterator=merged[Symbol.asyncIterator]();

		await iterator.next();
		await iterator.return?.();

		expect(cleanup.length).toBe(2);

	});

});


//// Tasks /////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("skip()", () => {

	it("should skip first n items", async () => {

		const values=await pipe(items([1, 2, 3, 4, 5])(skip(2)));

		expect(values).toEqual([3, 4, 5]);

	});

	it("should skip all items when n >= length", async () => {

		const values=await pipe(items([1, 2, 3])(skip(5)));

		expect(values).toEqual([]);

	});

	it("should skip zero items", async () => {

		const values=await pipe(items([1, 2, 3])(skip(0)));

		expect(values).toEqual([1, 2, 3]);

	});

});

describe("take()", () => {

	it("should take first n items", async () => {

		const values=await pipe(items([1, 2, 3, 4, 5])(take(3)));

		expect(values).toEqual([1, 2, 3]);

	});

	it("should take all items when n >= length", async () => {

		const values=await pipe(items([1, 2, 3])(take(5)));

		expect(values).toEqual([1, 2, 3]);

	});

	it("should take zero items", async () => {

		const values=await pipe(items([1, 2, 3])(take(0)));

		expect(values).toEqual([]);

	});

});

describe("peek()", () => {

	it("should execute side effect for each item", async () => {

		const sideEffects: number[]=[];
		const values=await pipe(
			items([1, 2, 3])(peek(x => sideEffects.push(x*10)))
		);

		expect(values).toEqual([1, 2, 3]);
		expect(sideEffects).toEqual([10, 20, 30]);

	});

	it("should support async consumers", async () => {

		const sideEffects: number[]=[];
		const values=await pipe(
			items([1, 2, 3])(peek(async x => {
				await Promise.resolve();
				sideEffects.push(x);
			}))
		);

		expect(values).toEqual([1, 2, 3]);
		expect(sideEffects).toEqual([1, 2, 3]);

	});

});

describe("filter()", () => {

	it("should filter items by predicate", async () => {

		const values=await pipe(
			items([1, 2, 3, 4, 5])(filter(x => x%2 === 0))
		);

		expect(values).toEqual([2, 4]);

	});

	it("should support async predicates", async () => {

		const values=await pipe(
			items([1, 2, 3, 4, 5])(filter(async x => {
				await Promise.resolve();
				return x > 2;
			}))
		);

		expect(values).toEqual([3, 4, 5]);

	});

	it("should handle empty results", async () => {

		const values=await pipe(
			items([1, 2, 3])(filter(() => false))
		);

		expect(values).toEqual([]);

	});

});

describe("distinct()", () => {

	it("should filter out duplicate primitives", async () => {

		const values=await pipe(
			items([1, 2, 2, 3, 1, 4])(distinct())
		);

		expect(values).toEqual([1, 2, 3, 4]);

	});

	it("should use selector for comparison", async () => {

		const values=await pipe(
			items([
				{ id: 1, name: "a" },
				{ id: 2, name: "b" },
				{ id: 1, name: "c" }
			])(distinct(item => item.id))
		);

		expect(values).toEqual([
			{ id: 1, name: "a" },
			{ id: 2, name: "b" }
		]);

	});

	it("should handle empty stream", async () => {

		const values=await pipe(
			items([] as number[])(distinct())
		);

		expect(values).toEqual([]);

	});

});

describe("map()", () => {

	it("should transform items", async () => {

		const values=await pipe(
			items([1, 2, 3])(map(x => x*2))
		);

		expect(values).toEqual([2, 4, 6]);

	});

	it("should support async mappers", async () => {

		const values=await pipe(
			items([1, 2, 3])(map(async x => {
				await Promise.resolve();
				return x*2;
			}))
		);

		expect(values).toEqual([2, 4, 6]);

	});

	it("should change item types", async () => {

		const values=await pipe(
			items([1, 2, 3])(map(x => `value-${x}`))
		);

		expect(values).toEqual(["value-1", "value-2", "value-3"]);

	});

});

describe("flatMap()", () => {

	it("should flatten mapped async iterables", async () => {

		const values=await pipe(
			items([1, 2, 3])(flatMap(async function* (x) {
				yield x;
				yield x*10;
			}))
		);

		expect(values).toEqual([1, 10, 2, 20, 3, 30]);

	});

	it("should handle empty iterables", async () => {

		const values=await pipe(
			items([1, 2, 3])(flatMap(async function* (x) {
				if ( x === 2 ) {
					yield x;
				}
			}))
		);

		expect(values).toEqual([2]);

	});

});

describe("batch()", () => {

	it("should group items into batches of specified size", async () => {

		const values=await pipe(
			items([1, 2, 3, 4, 5])(batch(2))
		);

		expect(values).toEqual([[1, 2], [3, 4], [5]]);

	});

	it("should collect all items when size is 0", async () => {

		const values=await pipe(
			items([1, 2, 3, 4, 5])(batch(0))
		);

		expect(values).toEqual([[1, 2, 3, 4, 5]]);

	});

	it("should handle empty stream", async () => {

		const values=await pipe(
			items([] as number[])(batch(2))
		);

		expect(values).toEqual([]);

	});

	it("should yield final partial batch", async () => {

		const values=await pipe(
			items([1, 2, 3])(batch(2))
		);

		expect(values).toEqual([[1, 2], [3]]);

	});

});


//// Sinks /////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

describe("forEach()", () => {

	it("should execute consumer for each item", async () => {

		const sideEffects: number[]=[];

		await items([1, 2, 3])(forEach(x => sideEffects.push(x)));

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

		await items([] as number[])(forEach(x => sideEffects.push(x)));

		expect(sideEffects).toEqual([]);

	});

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("complex pipelines", () => {

	it("should compose multiple operations", async () => {

		const result=await items([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
		(filter(x => x%2 === 0))
		(map(x => x*2))
		(skip(1))
		(take(2))
		(reduce((acc, x) => acc+x, 0));

		expect(result).toBe(20);

	});

	it("should handle async operations in pipeline", async () => {

		const result=await items([1, 2, 3, 4, 5])
		(map(async x => {
			await Promise.resolve();
			return x*2;
		}))
		(filter(async x => {
			await Promise.resolve();
			return x > 4;
		}))
		(toArray());

		expect(result).toEqual([6, 8, 10]);

	});

	it("should process batches through pipeline", async () => {

		const result=await items([1, 2, 3, 4, 5, 6, 7])
		(batch(3))
		(map(batch => batch.reduce((sum, n) => sum+n, 0)))
		(toArray());

		expect(result).toEqual([6, 15, 7]);

	});

});
