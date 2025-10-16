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
 * @groupDescription Drivers
 * Core utilities for processing pipes.
 *
 * @groupDescription Factories
 * Factory functions that create new pipes from various sources.
 *
 * @groupDescription Tasks
 * Intermediate operations that transform, filter, or process stream items while maintaining the stream flow.
 *
 * @groupDescription Sinks
 * Terminal operations that consume streams and produce final results.
 *
 * @module
 */

import { isAsyncIterable, isFunction, isIterable, isPromise } from "@/utilities/core";


/**
 * Flexible input source for stream processing.
 *
 * Represents various input formats that can be converted into async streams:
 *
 * - Single value: `V` - yields one item
 * - Array: `readonly V[]` - yields items from the array
 * - Synchronous iterable: `Iterable<V>` - yields items from the iterable
 * - Asynchronous iterable: `AsyncIterable<V>` - yields items from the async iterable
 * - Pipe: {@link Pipe}`<V>` - yields items from the pipe's underlying async iterable
 *
 * @typeParam V The type of values in the feed
 *
 * @remarks
 * This type enables functions to accept inputs in the most convenient format for the caller,
 * while internally normalizing them to async iterables for uniform processing.
 * Used extensively by {@link items} to create pipes and by {@link flatMap} to flatten nested feeds.
 *
 * @example
 * ```typescript
 * // All of these are valid Feed<number> values:
 * const singleValue: Feed<number> = 42;
 * const arrayFeed: Feed<number> = [1, 2, 3];
 * const iterableFeed: Feed<number> = new Set([1, 2, 3]);
 * const asyncFeed: Feed<number> = (async function*() { yield 1; yield 2; })();
 * const pipeFeed: Feed<number> = items([1, 2, 3]);
 * ```
 */
export type Feed<V>=V | readonly V[] | Iterable<V> | AsyncIterable<V> | Pipe<V>

/**
 * Fluent interface for composing async stream operations.
 *
 * @typeParam V The type of values in the stream
 */
export interface Pipe<V> {

	/**
	 * Retrieves the underlying async iterable.
	 *
	 * @returns The async iterable for manual iteration
	 */
	(): AsyncIterable<V>;

	/**
	 * Applies a transformation task to the stream.
	 *
	 * @typeParam R The type of transformed values
	 *
	 * @param task The task to apply
	 *
	 * @returns A new pipe with transformed values
	 */<R>(task: Task<V, R>): Pipe<R>;

	/**
	 * Applies a terminal sink operation to consume the stream.
	 *
	 * @typeParam R The type of result
	 *
	 * @param sink The sink to apply
	 *
	 * @returns A promise resolving to the sink's result
	 */<R>(sink: Sink<V, R>): Promise<R>;

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
 * Processes a promise, returning it as-is.
 *
 * @group Drivers
 *
 * @param source The promise to process
 *
 * @returns The same promise
 */
export function pipe<V>(source: Promise<V>): Promise<V>;

/**
 * Processes a pipe, retrieving its underlying async iterable.
 *
 * @group Drivers
 *
 * @param source The pipe to process
 */
export function pipe<T>(source: Pipe<T>): AsyncIterable<T>;

export function pipe(source: unknown): unknown {

	return isFunction(source) ? source() : source;

}


//// Factories /////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a pipe that yields a sequence of numbers within a range.
 *
 * Generates numbers in ascending order if `start` < `end`, or descending order if `start` > `end`.
 *
 * @group Factories
 *
 * @param start The starting value (inclusive)
 * @param end The ending value (exclusive)
 *
 * @returns A pipe yielding numbers from start to end
 */
export function range(start: number, end: number): Pipe<number> {

	async function* generator() {
		if ( start < end ) {

			for (let i=start; i < end; i++) {
				yield i;
			}

		} else {

			for (let i=start; i > end; i--) {
				yield i;
			}

		}
	}

	return items(generator());
}

/**
 * Creates a pipe from an item feed.
 *
 * @group Factories
 *
 * @typeParam V The type of items in the stream
 *
 * @param feed The source to create a pipe from
 *
 * @returns A pipe for fluent composition
 */
export function items<V>(feed: Feed<V>): Pipe<V> {

	const generator=isFunction(feed) ?

		async function* () {
			yield* feed();
		}

		: isAsyncIterable<V>(feed) ?

			async function* () {
				yield* feed;
			}

			: isIterable<V>(feed) ?

				async function* () {
					for (const item of feed) {
						yield item;
					}
				}

				: async function* () {
					yield feed;
				};

	function pipe(): AsyncIterable<V>;
	function pipe<R>(task: Task<V, R>): Pipe<R>;
	function pipe<R>(sink: Sink<V, R>): Promise<R>;
	function pipe<R>(step?: Task<V, R> | Sink<V, R>): unknown {

		if ( step ) {

			const result=step(generator());

			return isPromise(result) ? result : items(result);

		} else {

			return generator();

		}
	}

	return pipe;

}

/**
 * Merges multiple pipes into a single stream, yielding items as they become available.
 *
 * Items are emitted in the order they resolve, not in source order.
 * All sources are consumed concurrently.
 *
 * @group Factories
 *
 * @typeParam T The type of items in the streams
 *
 * @param sources The pipes to merge
 *
 * @returns A pipe containing all items from all sources
 */
export function merge<V>(...sources: readonly Pipe<V>[]): Pipe<V> {

	const generator=async function* () {

		const iterators=sources.map(source => source()[Symbol.asyncIterator]());

		const pending=new Map(
			iterators.map(iterator => {
				return [iterator, iterator.next().then(result => ({ iterator, result }))] as const;
			})
		);

		try {

			while ( pending.size > 0 ) {

				const { iterator, result }=await Promise.race(pending.values());

				if ( result.done ) {

					pending.delete(iterator);

				} else { // schedule next iteration before yielding to prevent race conditions

					pending.set(iterator, iterator.next().then((result: IteratorResult<V>) => ({
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

	return items(generator());
}


//// Tasks /////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a task skipping the first n items from the stream.
 *
 * @group Tasks
 *
 * @typeParam V The type of items in the stream
 *
 * @param n The number of items to skip (negative values treated as zero)
 *
 * @returns A task that skips the first n items
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
 * Creates a task taking only the first n items from the stream.
 *
 * @group Tasks
 *
 * @typeParam V The type of items in the stream
 *
 * @param n The maximum number of items to take (negative values treated as zero)
 *
 * @returns A task that takes the first n items
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
 * Creates a task executing a side effect for each item without modifying the stream.
 *
 * Useful for debugging or monitoring items as they flow through the pipeline.
 *
 * @group Tasks
 *
 * @typeParam V The type of items in the stream
 *
 * @param consumer The function to execute for each item
 *
 * @returns A task that executes the consumer for each item
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
 * Creates a task filtering stream items based on a predicate.
 *
 * @group Tasks
 *
 * @typeParam V The type of items in the stream
 *
 * @param predicate The function to test each item
 *
 * @returns A task that filters items based on the predicate
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
 * Creates a task filtering out duplicate items.
 *
 * @group Tasks
 *
 * @typeParam V The type of items in the stream
 * @typeParam K The type of comparison key
 *
 * @param selector Optional function to extract comparison key from items
 *
 * @returns A task that filters out duplicate items
 *
 * @remarks
 * Maintains a `Set` of all seen items in memory. For large or infinite streams
 * with many unique items, this may cause memory issues.
 */
export function distinct<V, K>(selector?: (item: V) => K | Promise<K>): Task<V> {
	return async function* (source: AsyncIterable<V>) {

		const seen=new Set();

		for await (const item of source) {

			const key=selector ? await selector(item) : item;

			if ( !seen.has(key) ) {
				seen.add(key);
				yield item;
			}
		}

	};
}

/**
 * Creates a task transforming each item using a mapper function.
 *
 * @group Tasks
 *
 * @typeParam V The type of input items
 * @typeParam R The type of output items
 *
 * @param mapper The function to transform each item
 *
 * @returns A task that transforms items using the mapper
 */
export function map<V, R>(mapper: (item: V) => R | Promise<R>): Task<V, R> {
	return async function* (source: AsyncIterable<V>) {
		for await (const item of source) {
			yield await mapper(item);
		}
	};
}

/**
 * Creates a task transforming and flattening stream items.
 *
 * @group Tasks
 *
 * @typeParam V The type of input items
 * @typeParam R The type of output items
 *
 * @param mapper The function to transform each item into an item feed
 *
 * @returns A task that transforms and flattens items
 */
export function flatMap<V, R>(mapper: (item: V) => Feed<R> | Promise<Feed<R>>): Task<V, R> {
	return async function* (source: AsyncIterable<V>) {
		for await (const item of source) {

			const result=await mapper(item);

			if ( isFunction(result) ) {

				yield* result();

			} else if ( isAsyncIterable<R>(result) ) {

				yield* result;

			} else if ( isIterable<R>(result) ) {

				for (const value of result) {
					yield value;
				}

			} else {

				yield result;

			}

		}
	};
}

/**
 * Creates a task grouping items into batches of a specified size.
 *
 * If size is 0 or negative, collects all items into a single batch.
 * The final batch may contain fewer items than the specified size.
 *
 * @group Tasks
 *
 * @typeParam V The type of items in the stream
 *
 * @param size The maximum number of items per batch (0 or negative for unbounded)
 *
 * @returns A task that groups items into batches
 *
 * @remarks
 * When size is 0 or negative, all stream items are accumulated in memory before
 * yielding a single batch. For large or infinite streams, this may cause
 * memory issues. Use a positive size for bounded memory consumption.
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
 * Creates a sink checking if any item satisfies the predicate.
 *
 * @group Sinks
 *
 * @typeParam V The type of items in the stream
 *
 * @param predicate The function to test each item
 *
 * @returns A sink that checks if any item satisfies the predicate
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
 * Creates a sink checking if all items satisfy the predicate.
 *
 * @group Sinks
 *
 * @typeParam V The type of items in the stream
 *
 * @param predicate The function to test each item
 *
 * @returns A sink that checks if all items satisfy the predicate
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
 * Creates a sink retrieving the first item that satisfies the predicate.
 *
 * @group Sinks
 *
 * @typeParam V The type of items in the stream
 *
 * @param predicate The function to test each item
 *
 * @returns A sink that retrieves the first matching item or undefined
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
 * Creates a sink reducing the stream to a single value without an initial value.
 *
 * @group Sinks
 *
 * @typeParam V The type of items in the stream
 *
 * @param reducer The function to combine the accumulator with each item
 *
 * @returns A sink that reduces the stream to a single value, the first item for singleton streams,
 * or `undefined` for empty streams
 */
export function reduce<V>(reducer: (accumulator: V, item: V) => V | Promise<V>): Sink<V, undefined | V>;

/**
 * Creates a sink reducing the stream to a single value with an initial value.
 *
 * @group Sinks
 *
 * @typeParam V The type of items in the stream
 * @typeParam R The type of the accumulated result
 *
 * @param reducer The function to combine the accumulator with each item
 * @param initial The initial value for the accumulator
 *
 * @returns A sink that reduces the stream to a single value
 */
export function reduce<V, R>(reducer: (accumulator: R, item: V) => R | Promise<R>, initial: R): Sink<V, R>;

export function reduce<V, R>(reducer: Function, initial?: R): Sink<V, undefined | V | R> {
	return async source => {

		let started=arguments.length > 1;
		let accumulator: V | R | undefined=started ? initial : undefined;

		for await (const item of source) {
			if ( started ) {
				accumulator= await reducer(accumulator, item);
			} else {
				accumulator=item;
				started=true;
			}
		}

		return accumulator;

	};
}

/**
 * Creates a sink collecting all items into an array.
 *
 * @group Sinks
 *
 * @typeParam V The type of items in the stream
 *
 * @returns A sink that collects all items into an array
 */
export function toArray<V>(): Sink<V, readonly V[]> {
	return async source => {

		const array: V[]=[];

		for await (const item of source) {
			array.push(item);
		}

		return array;
	};
}

/**
 * Creates a sink collecting all unique items into a set.
 *
 * @group Sinks
 *
 * @typeParam V The type of items in the stream
 *
 * @returns A sink that collects all unique items into a set
 */
export function toSet<V>(): Sink<V, ReadonlySet<V>> {
	return async source => {

		const set=new Set<V>();

		for await (const item of source) {
			set.add(item);
		}

		return set;
	};
}

/**
 * Creates a sink collecting items into a map using item values.
 *
 * @group Sinks
 *
 * @typeParam V The type of items in the stream
 * @typeParam K The type of map keys
 *
 * @param key The function to extract the key from each item
 *
 * @returns A sink that collects items into a map with keys from the key selector and items as values
 */
export function toMap<V, K>(
	key: (item: V) => K | Promise<K>
): Sink<V, ReadonlyMap<K, V>>;

/**
 * Creates a sink collecting items into a map using custom keys and values.
 *
 * @group Sinks
 *
 * @typeParam V The type of items in the stream
 * @typeParam K The type of map keys
 * @typeParam R The type of map values
 *
 * @param key The function to extract the key from each item
 * @param value The function to transform each item into a map value
 *
 * @returns A sink that collects items into a map with keys and values from the selectors
 */
export function toMap<V, K, R>(
	key: (item: V) => K | Promise<K>,
	value: (item: V) => R | Promise<R>
): Sink<V, ReadonlyMap<K, R>>;

export function toMap<V, K, R>(
	key: (item: V) => K | Promise<K>,
	value?: (item: V) => R | Promise<R>
): Sink<V, ReadonlyMap<K, V | R>> {
	return async source => {

		const map=new Map<K, V | R>();

		for await (const item of source) {

			map.set(
				await key(item),
				value ? await value(item) : item
			);

		}

		return map;
	};
}

/**
 * Creates a sink executing a side effect for each item and consuming the stream.
 *
 * Terminal operation that triggers stream execution.
 *
 * @group Sinks
 *
 * @typeParam V The type of items in the stream
 *
 * @param consumer The function to execute for each item
 *
 * @returns A sink that executes the consumer for each item
 */
export function forEach<V>(consumer: (item: V) => void | Promise<void>): Sink<V, void> {
	return async source => {

		for await (const item of source) {
			await consumer(item);
		}

	};
}
