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

import { Cache } from "@/utilities/core/cache";
import { hash } from "@/utilities/core/index";
import { log } from "@/utilities/core/log";

/**
 * @module
 *
 * Cacheable processing pipeline that intercepts Promise.then() calls for automatic caching.
 *
 * **IMPORTANT**: Only named functions passed to `.task()` are cached. Anonymous functions
 * and arrow functions are never cached. Use the `as()` helper to create named wrappers
 * for caching anonymous functions.
 */

/**
 * A Promise-like interface for cacheable processing pipelines.
 *
 * Extends the standard Promise interface with an additional `task` method
 * that provides caching behavior for named functions.
 *
 * @template T The type of data flowing through the pipeline
 */
export interface Pipe<T> extends Promise<T> {

	/**
	 * Processes the pipeline value with caching for named functions.
	 *
	 * **CACHING BEHAVIOR**: Only functions with a `.name` property are cached.
	 * Anonymous functions, arrow functions, and unnamed functions are executed
	 * without caching. Use the `as()` helper to create named wrappers.
	 *
	 * @param fulfilled Function to transform the value (cached if named)
	 * @param rejected Function to handle rejections
	 *
	 * @returns A new Pipe with the transformed value
	 *
	 */
	task<V=T, R=never>(
		fulfilled?: ((value: T) => V | PromiseLike<V>) | undefined | null,
		rejected?: ((reason: any) => R | PromiseLike<R>) | undefined | null
	): Pipe<V | R>;

	/**
	 * Processes the pipeline value without caching.
	 *
	 * @param fulfilled Function to transform the value (never cached)
	 * @param rejected Function to handle rejections
	 *
	 * @returns A new Pipe with the transformed value
	 */
	then<V=T, R=never>(
		fulfilled?: ((value: T) => V | PromiseLike<V>) | undefined | null,
		rejected?: ((reason: any) => R | PromiseLike<R>) | undefined | null
	): Pipe<V | R>;

}

/**
 * Cached intermediate result produced by a pipeline task.
 *
 * @template T - The type of data returned by task execution
 */
export interface Memo<T=any> {

	/** The label of the pipeline that produced this memo */
	readonly pipe: string;

	/** The name of the pipeline task that produced this memo */
	readonly task: string;

	/** The hash of the data of this memo */
	readonly hash: string;

	/** The data payload of this memo */
	readonly data: T;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a cacheable processing pipeline that intercepts Promise.then() calls.
 *
 * **CACHING RULES**:
 *
 * - Functions passed to `.task()` are cached ONLY if they have a `.name` property
 * - Functions passed to `.then()` are NEVER cached (stateless operations)
 * - Anonymous functions and arrow functions are NOT cached
 * - Use the `as()` helper to create named wrappers for caching
 *
 * Cache keys are based on: pipeline label + function name + input data hash.
 * Subsequent calls with identical inputs return cached results without re-execution.
 *
 * @template T - The type of data flowing through the pipeline
 *
 * @param data - The initial data to process through the pipeline
 * @param label - Label for the pipeline (used in cache keys and logging)
 * @param cache - Cache instance for storing intermediate results
 *
 * @returns A Promise-like object that intercepts .then() calls for caching
 */
export function pipe<T>(data: T | PromiseLike<T>, {

	label,
	cache

}: {

	label: string
	cache: Cache<Memo>

}): Pipe<T> {

	function process<V>(memo: Promise<Memo<V>>): Pipe<V> {
		return {

			[Symbol.toStringTag]: "Pipe",

			task<F=V, R=never>(
				fulfilled?: undefined | null | ((value: V) => F | PromiseLike<F>),
				rejected?: undefined | null | ((reason: any) => R | PromiseLike<R>)
			): Pipe<F | R> {

				return process(memo.then(
					fulfilled?.name ? (value: Memo<V>) => {

							return cache.lookup(JSON.stringify({

								pipe: label,
								task: fulfilled.name,
								hash: value.hash

							}), () => {

								log.info(`${pipe.name}(${label})`, `executing <${fulfilled.name}>`);

								return Promise.resolve(fulfilled(value.data)).then(data => ({

									pipe: label,
									task: fulfilled.name,
									hash: hash(JSON.stringify(data ?? null)),
									data

								}));

							});

						}

						: fulfilled ? (value: Memo<V>) => {

								return Promise.resolve(fulfilled(value.data)).then(data => ({

									pipe: label,
									task: "",
									hash: hash(JSON.stringify(data ?? null)),
									data

								}));

							}

							: (value: Memo<V>) => ({

								pipe: label,
								task: "",
								hash: value.hash,
								data: value.data

							}),

					rejected ? (reason: any) => {

							return Promise.resolve(rejected(reason)).then(data => ({

								pipe: label,
								task: "",
								hash: hash(JSON.stringify(data ?? null)),
								data

							}));
						}

						: undefined
				));

			},

			then<F=V, R=never>(
				fulfilled?: undefined | null | ((value: V) => F | PromiseLike<F>),
				rejected?: undefined | null | ((reason: any) => R | PromiseLike<R>)
			): Pipe<F | R> {

				return process(memo.then(
					fulfilled ? (value: Memo<V>) => {

							return Promise.resolve(fulfilled(value.data)).then(data => ({

								pipe: label,
								task: "",
								hash: hash(JSON.stringify(data ?? null)),
								data

							}));

						}

						: (value: Memo<V>) => ({

							pipe: label,
							task: "",
							hash: value.hash,
							data: value.data as Awaited<F>

						}),

					rejected ? (reason: any) => {

							return Promise.resolve(rejected(reason)).then(data => ({

								pipe: label,
								task: "",
								hash: hash(JSON.stringify(data ?? null)),
								data

							}));
						}

						: undefined
				));

			},

			catch<R=never>(
				rejected?: undefined | null | ((reason: any) => R | PromiseLike<R>)
			): Promise<V | R> {

				return rejected ? process(memo.catch((reason: any) => {

						return Promise.resolve(rejected(reason)).then(data => ({

							pipe: label,
							task: "",
							hash: hash(JSON.stringify(data ?? null)),
							data

						}));

					}))

					: this;
			},

			finally(settled?: undefined | null | (() => void)): Promise<V> {
				return settled ? process(memo.finally(settled)) : this;
			}

		};
	}


	return process<T>(Promise.resolve(data).then(data => ({
		pipe: label,
		task: "",
		hash: hash(JSON.stringify(data ?? null)),
		data: data
	})));
}

/**
 * Creates a named wrapper function that delegates to the provided task function.
 *
 * This is essential for enabling caching in pipelines, as only functions with
 * a `.name` property are cached by the `.task()` method.
 *
 * @param name The name to assign to the wrapper function (used for caching)
 * @param task The task function to wrap and delegate to
 *
 * @returns A named function that delegates to the provided task
 */
export function as<V, R>(name: string, task: (value: V) => R | PromiseLike<R>): typeof task {
	return Object.defineProperty((value: V) => task(value), "name", { value: name });
}
