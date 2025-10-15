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

import { isAsyncIterable, isFunction, isIterable, isPromise } from "@/utilities/core";


export interface Pipe<V> {

	<R>(task: Task<V, R>): Pipe<R>;

	<R>(sink: Sink<V, R>): Promise<R>;

	(): AsyncIterable<V>;

}

export interface Task<V, R=V> {

	(value: AsyncIterable<V>): AsyncIterable<R>;

}

export interface Sink<V, R=V> {

	(value: AsyncIterable<V>): Promise<R>;

}


//// Drivers ///////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function process<T>(source: Pipe<T> | AsyncIterable<T>): Promise<void> {

	for await (const {} of isFunction(source) ? source() : source as AsyncIterable<T>) {}

}

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

export function filter<V>(predicate: (item: V) => boolean | Promise<boolean>): Task<V> {
	return async function* (source: AsyncIterable<V>) {
		for await (const item of source) {
			if ( await predicate(item) ) {
				yield item;
			}
		}
	};
}

export function map<V, R>(mapper: (item: V) => R | Promise<R>): Task<V, R> {
	return async function* (source: AsyncIterable<V>) {
		for await (const item of source) {
			yield await mapper(item);
		}
	};
}

export function flatMap<V, R>(mapper: (item: V) => AsyncIterable<R>): Task<V, R> {
	return async function* (source: AsyncIterable<V>) {
		for await (const item of source) {
			yield* mapper(item);
		}
	};
}

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

export function forEach<V>(consumer: (item: V) => void | Promise<void>): Task<V> {
	return async function* (source: AsyncIterable<V>) {
		for await (const item of source) {
			await consumer(item);
			yield item;
		}
	};
}


//// Sinks /////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

export function toArray<V>(): Sink<V, readonly V[]> {
	return async source => {

		const values: V[]=[];

		for await (const item of source) {
			values.push(item);
		}

		return values;
	};
}
