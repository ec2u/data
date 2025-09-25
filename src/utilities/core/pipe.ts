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
 * @module
 *
 * Cacheable processing pipeline that intercepts Promise.then() calls for automatic caching.
 */


import { Cache } from "@/utilities/core/cache";
import { hash } from "@/utilities/core/index";
import { log } from "@/utilities/core/log";


/**
 * Cached intermediate result produced by a pipeline step.
 *
 * @template T - The type of data returned by step execution
 */
export interface Artifact<T=any> {

	/** The label of the pipeline that produced this artifact */
	readonly pipe: string;

	/** The name of the pipeline step that produced this artifact */
	readonly step: string;

	/** The hash of the data of this artifact */
	readonly hash: string;

	/** The data payload of this artifact */
	readonly data: T;

}

/**
 * Creates a cacheable processing pipeline that intercepts Promise.then() calls.
 *
 * Each **named** function passed to .then() is cached based on the pipeline label,
 * function name, and input data. Subsequent calls with identical inputs will
 * return cached results without re-executing the function.
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
	cache: Cache<Artifact>

}): Promise<T> {

	function process<V>(artifact: Promise<Artifact<V>>): Promise<V> {
		return {

			[Symbol.toStringTag]: "Promise",

			then<F=V, R=never>(
				fulfilled?: undefined | null | ((value: V) => F | PromiseLike<F>),
				rejected?: undefined | null | ((reason: any) => R | PromiseLike<R>)
			): Promise<F | R> {

				return process(artifact.then(
					fulfilled?.name ? (value: Artifact<V>) => {

							return cache.lookup(JSON.stringify({

								pipe: label,
								step: fulfilled.name,
								hash: value.hash

							}), () => {

								log.info(`${pipe.name}(${label})`, `executing <${fulfilled.name}>`);

								return Promise.resolve(fulfilled(value.data)).then(data => ({

									pipe: label,
									step: fulfilled.name,
									hash: hash(JSON.stringify(data ?? null)),
									data

								}));

							});

						}

						: fulfilled ? (value: Artifact<V>) => {

								return Promise.resolve(fulfilled(value.data)).then(data => ({

									pipe: label,
									step: "",
									hash: hash(JSON.stringify(data ?? null)),
									data

								}));

							}

							: (value: Artifact<V>) => value,

					rejected ? (reason: any) => {

							return Promise.resolve(rejected(reason)).then(data => ({

								pipe: label,
								step: "",
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

				return rejected ? process(artifact.catch((reason: any) => {

						return Promise.resolve(rejected(reason)).then(data => ({

							pipe: label,
							step: "",
							hash: hash(JSON.stringify(data ?? null)),
							data

						}));

					}))

					: this;
			},

			finally(settled?: undefined | null | (() => void)): Promise<V> {
				return settled ? process(artifact.finally(settled)) : this;
			}

		};
	}


	return process<T>(Promise.resolve(data).then(data => ({
		pipe: label,
		step: "",
		hash: hash(JSON.stringify(data ?? null)),
		data: data
	})));
}
