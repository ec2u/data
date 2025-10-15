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

/**
 * Asynchronous stream processing utilities.
 *
 * Provides a composable API for working with async iterables through pipes, tasks, and sinks.
 *
 * Core abstractions:
 *
 * - {@link Pipe} - Fluent interface for chaining operations on async streams
 * - {@link Task} - Transformations that process and pass through stream items
 * - {@link Sink} - Terminal operations that consume streams and produce results
 *
 * @module
 */

import { isAsyncIterable, isFunction, isIterable, isPromise } from "@/utilities/core";


/**
 * Fluent interface for composing async stream operations.
 *
 * Supports three call patterns:
 *
 * - Apply a task: `pipe(data)(map(x => x * 2))` returns {@link Pipe}
 * - Apply a sink: `pipe(data)(toArray())` returns `Promise`
 * - Get iterator: `pipe(data)()` returns `AsyncIterable`
 *
 * @typeParam V The type of values in the stream
 */
export interface Pipe<V> {

	<R>(task: Task<V, R>): Pipe<R>;

	<R>(sink: Sink<V, R>): Promise<R>;

	(): AsyncIterable<V>;

}

/**
 * Transformation that processes stream items and yields results.
 *
 * Tasks are intermediate operations that can be chained together.
 * They transform, filter, or otherwise process items while maintaining the stream.
 *
 * @typeParam V The type of input values
 * @typeParam R The type of output values (defaults to V)
 */
export interface Task<V, R=V> {

	(value: AsyncIterable<V>): AsyncIterable<R>;

}

/**
 * Terminal operation that consumes a stream and produces a result.
 *
 * Sinks trigger stream execution and return a promise that resolves
 * when all items have been processed.
 *
 * @typeParam V The type of input values
 * @typeParam R The type of result (defaults to V)
 */
export interface Sink<V, R=V> {

	(value: AsyncIterable<V>): Promise<R>;

}


//// Drivers ///////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Executes an async stream, consuming all items without collecting results.
 *
 * Useful for triggering side effects in a pipeline without accumulating values.
 *
 * @param source The pipe or async iterable to process
 * @typeParam T The type of items in the stream
 */
export async function process<T>(source: Pipe<T> | AsyncIterable<T>): Promise<void> {

	for await (const {} of isFunction(source) ? source() : source as AsyncIterable<T>) {}

}

/**
 * Collects all items from a source into an array or returns a promise directly.
 *
 * @param source The promise, pipe, or async iterable to collect from
 * @typeParam T The type of items to collect
 * @returns The promise value directly, or an array of collected items
 */
export function collect<T>(source: Promise<T>): Promise<T>;
export function collect<T>(source: Pipe<T>): Promise<readonly T[]>;
export function collect<T>(source: AsyncIterable<T>): Promise<readonly T[]>;
export async function collect(source: unknown): Promise<unknown> {

	if ( isPromise(source) ) {

		return source;

	} else {

		const values: unknown[]=[];

		for await (const item of isFunction(source) ? source() : source) {
			values.push(item);
		}

		return values;

	}
}


//// Factories /////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a {@link Pipe} from a value, array, iterable, or async iterable.
 *
 * @param value The source to create a pipe from
 * @typeParam T The type of items in the stream
 * @returns A pipe that can be used for fluent composition
 */
export function pipe<T>(value: T | readonly T[] | Iterable<T> | AsyncIterable<T>): Pipe<T> {

	const iterable=isAsyncIterable<T>(value)

		? async function* () {
			for await (const item of value) {
				yield item;
			}
		}

		: isIterable<T>(value)

			? async function* () {
				for (const item of value) {
					yield item;
				}
			}

			: async function* () {
				yield value;
			};

	return function <R>(transform?: (source: AsyncIterable<T>) => R): Pipe<R> | Promise<R> | AsyncIterable<T> {

		if ( !transform ) {
			return iterable();
		}

		const result=transform(iterable());

		return isPromise<R>(result) ? result : pipe(result);

	} as Pipe<T>;

}

/**
 * Merges multiple async sources into a single stream, yielding items as they become available.
 *
 * Items are emitted in the order they resolve, not the order of sources.
 * All sources are processed concurrently.
 *
 * @param sources The pipes or async iterables to merge
 * @typeParam T The type of items in the streams
 * @returns A pipe or async iterable containing all items from all sources
 */
export function merge<T>(...sources: readonly Pipe<T>[]): Pipe<T>;
export function merge<T>(...sources: readonly AsyncIterable<T>[]): AsyncIterable<T>;
export function merge(...sources: readonly unknown[]): unknown {

	const pipes=sources.every(isFunction);

	const generator=async function* () {

		const iterators=sources.map(source =>
			(isFunction(source) ? source() : source)[Symbol.asyncIterator]()
		);

		const pending=new Map(
			iterators.map(iterator => {
				const promise=iterator.next().then((result: IteratorResult<unknown>) => ({ iterator, result }));
				return [iterator, promise] as const;
			})
		);

		try {

			while ( pending.size > 0 ) {

				const { iterator, result }=await Promise.race(pending.values());

				if ( result.done ) {

					pending.delete(iterator);

				} else { // schedule next iteration before yielding to prevent race conditions

					pending.set(iterator, iterator.next().then((result: IteratorResult<unknown>) => ({
						iterator,
						result
					})));

					yield result.value;

				}
			}

		} finally { // clean up any remaining iterators on error or early termination

			await Promise.allSettled(
				Array.from(pending.keys()).map(iterator => iterator.return?.())
			);

		}
	};

	return pipes ? pipe(generator()) : generator();
}


//// Tasks /////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Task skipping the first n items from the stream.
 *
 * @param n The number of items to skip
 * @typeParam V The type of items in the stream
 */
export function skip<V>(n: number): Task<V> {
	return async function* (source: AsyncIterable<V>) {

		let count=0;

		for await (const item of source) {
			if ( count >= n ) {
				yield item;
			} else {
				count++;
			}
		}
	};
}

/**
 * Task taking only the first n items from the stream.
 *
 * @param n The maximum number of items to take
 * @typeParam V The type of items in the stream
 */
export function take<V>(n: number): Task<V> {
	return async function* (source: AsyncIterable<V>) {

		let count=0;

		for await (const item of source) {
			if ( count < n ) {
				yield item;
				count++;
			}
		}
	};
}

/**
 * Task executing a side-effect for each item without modifying the stream.
 *
 * Useful for debugging or monitoring items as they flow through the pipeline.
 *
 * @param consumer The function to execute for each item
 * @typeParam V The type of items in the stream
 */
export function peek<V>(consumer: (item: V) => void | Promise<void>): Task<V> {
	return async function* (source: AsyncIterable<V>) {
		for await (const item of source) {
			await consumer(item);
			yield item;
		}
	};
}

/**
 * Task filtering stream items based on a predicate.
 *
 * @param predicate The function to test each item
 * @typeParam V The type of items in the stream
 */
export function filter<V>(predicate: (item: V) => boolean | Promise<boolean>): Task<V> {
	return async function* (source: AsyncIterable<V>) {
		for await (const item of source) {
			if ( await predicate(item) ) {
				yield item;
			}
		}
	};
}

/**
 * Task transforming each item using a mapper function.
 *
 * @param mapper The function to transform each item
 * @typeParam V The type of input items
 * @typeParam R The type of output items
 */
export function map<V, R>(mapper: (item: V) => R | Promise<R>): Task<V, R> {
	return async function* (source: AsyncIterable<V>) {
		for await (const item of source) {
			yield await mapper(item);
		}
	};
}

/**
 * Task transforming each item into an async iterable and flattening results.
 *
 * @param mapper The function to transform each item into an async iterable
 * @typeParam V The type of input items
 * @typeParam R The type of output items
 */
export function flatMap<V, R>(mapper: (item: V) => AsyncIterable<R>): Task<V, R> {
	return async function* (source: AsyncIterable<V>) {
		for await (const item of source) {
			yield* mapper(item);
		}
	};
}

/**
 * Task filtering out duplicate items.
 *
 * Note: Maintains a Set of all seen items in memory.
 *
 * @param selector Optional function to extract comparison key from items
 * @typeParam V The type of items in the stream
 */
export function distinct<V>(selector?: (item: V) => unknown): Task<V> {
	return async function* (source: AsyncIterable<V>) {

		const seen=new Set<unknown>();

		for await (const item of source) {

			const key=selector ? selector(item) : item;

			if ( !seen.has(key) ) {
				seen.add(key);
				yield item;
			}
		}

	};
}

/**
 * Task grouping items into batches of a specified size.
 *
 * If size is 0, collects all items into a single batch.
 * The final batch may contain fewer items than the specified size.
 *
 * Note: When size is 0, all stream items are accumulated in memory before
 * yielding a single batch. For large or infinite streams, this may cause
 * memory issues. Use a positive size for bounded memory consumption.
 *
 * @param size The maximum number of items per batch (0 for unbounded)
 * @typeParam V The type of items in the stream
 */
export function batch<V>(size: number=0): Task<V, readonly V[]> {
	return async function* (source: AsyncIterable<V>) {

		const batch: V[]=[];

		for await (const item of source) {

			batch.push(item);

			if ( size > 0 && batch.length >= size ) {
				yield batch.splice(0);
			}
		}

		if ( batch.length > 0 ) {
			yield batch;
		}
	};
}


//// Sinks /////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Sink reducing the stream to a single value.
 *
 * With an initial value, returns that type.
 * Without an initial value, returns the first item or undefined for empty streams.
 *
 * @param reducer The function to combine the accumulator with each item
 * @param initial Optional initial value for the accumulator
 * @typeParam V The type of items in the stream
 * @typeParam R The type of the accumulated result
 */
export function reduce<V, R>(reducer: (accumulator: R, item: V) => R | Promise<R>, initial: R): Sink<V, R>;
export function reduce<V>(reducer: (accumulator: V, item: V) => V | Promise<V>): Sink<V, undefined | V>;
export function reduce(reducer: Function, initial?: unknown): Sink<unknown, unknown> {

	const sentinel={} as symbol;

	return async source => {

		let accumulator: unknown=arguments.length > 1 ? initial! : sentinel;

		for await (const item of source) {
			accumulator=accumulator === sentinel ? item : await reducer(accumulator, item);
		}

		return accumulator === sentinel ? undefined : accumulator;
	};
}

/**
 * Sink retrieving the first item that satisfies the predicate.
 *
 * @param predicate The function to test each item
 * @typeParam V The type of items in the stream
 */
export function find<V>(predicate: (item: V) => boolean | Promise<boolean>): Sink<V, undefined | V> {
	return async source => {

		for await (const item of source) {
			if ( await predicate(item) ) {
				return item;
			}
		}

		return undefined;
	};
}

/**
 * Sink checking if any item satisfies the predicate.
 *
 * @param predicate The function to test each item
 * @typeParam V The type of items in the stream
 */
export function some<V>(predicate: (item: V) => boolean | Promise<boolean>): Sink<V, boolean> {
	return async source => {

		for await (const item of source) {
			if ( await predicate(item) ) {
				return true;
			}
		}

		return false;
	};
}

/**
 * Sink checking if all items satisfy the predicate.
 *
 * @param predicate The function to test each item
 * @typeParam V The type of items in the stream
 */
export function every<V>(predicate: (item: V) => boolean | Promise<boolean>): Sink<V, boolean> {
	return async source => {

		for await (const item of source) {
			if ( !await predicate(item) ) {
				return false;
			}
		}

		return true;
	};
}

/**
 * Sink collecting all items into an array.
 *
 * @typeParam V The type of items in the stream
 */
export function toArray<V>(): Sink<V, readonly V[]> {
	return async source => {

		const values: V[]=[];

		for await (const item of source) {
			values.push(item);
		}

		return values;
	};
}

/**
 * Sink executing a side-effect for each item and consuming the stream.
 *
 * Terminal operation that triggers stream execution.
 *
 * @param consumer The function to execute for each item
 * @typeParam V The type of items in the stream
 */
export function forEach<V>(consumer: (item: V) => void | Promise<void>): Sink<V, void> {
	return async source => {

		for await (const item of source) {
			await consumer(item);
		}

	};
}
