/*
 * Copyright © 2020-2021 Metreeca srl
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

import { Entry, Error, Frame, freeze, Graph, Query, State, url } from "./index";

export function RESTGraph(): Graph {

	const fetcher=fetch; // !!! configurable


	const cache=new Map<string, Entry>(); // !!! TTL / size limits / …

	const observers=new Map<string, Set<() => void>>();


	function notify(id: string) {
		observers.get(id)?.forEach(observer => observer());
	}


	return freeze({

		get<F extends Frame=Frame, E extends Error=Error>(id: string, model: F, query?: Query): Entry<typeof model, E> {

			const key=url(id, query);

			let entry=cache.get(key) as Entry<F, E>;

			if ( !entry ) {

				const controller=new AbortController();


				cache.set(key, entry=freeze({

					blank<V>(mapper: () => undefined | V): undefined | V {
						return mapper();
					},

					fetch<V>(mapper: (abort: () => void) => undefined | V): undefined | V {
						return mapper(controller.abort);
					},


					frame<V>(mapper: (frame: F) => undefined | V): undefined | V {
						return undefined;
					},

					error<V>(mapper: (error: E) => undefined | V): undefined | V {
						return undefined;
					}

				}));


				fetcher(key, {

					headers: { Accept: "application/json" }, // !!! interceptor for session management

					signal: controller.signal

				})

					.catch(reason => new Response("{}", { // error to synthetic response conversion

						status: 0,
						statusText: String(reason)

					}))

					.then(response => response.json().then(json => {

						if ( response.ok ) {

							const frame=freeze(json);

							cache.set(key, freeze({

								blank<V>(mapper: () => undefined | V): undefined | V {
									return undefined;
								},

								fetch<V>(mapper: (abort: () => void) => undefined | V): undefined | V {
									return undefined;
								},


								frame<V>(mapper: (frame: F) => undefined | V): undefined | V {
									return mapper(frame);
								},

								error<V>(mapper: (error: E) => undefined | V): undefined | V {
									return undefined;
								}

							}));

						} else {

							const error=<E>freeze({

								status: response.status,
								reason: response.statusText,

								detail: json

							});

							cache.set(key, freeze({

								blank<V>(mapper: () => undefined | V): undefined | V {
									return mapper();
								},

								fetch<V>(mapper: (abort: () => void) => undefined | V): undefined | V {
									return undefined;
								},


								frame<V>(mapper: (frame: F) => undefined | V): undefined | V {
									return undefined;
								},

								error<V>(mapper: (error: E) => undefined | V): undefined | V {
									return mapper(error);
								}

							}));

						}

						notify(id);

					}));

			}

			return entry;

		},


		post<E extends Error=Error>(id: string, state: State): Entry<Frame, E> {
			throw "to be implemented"; //  !!! invalidate cache // notify observers
		},

		put<E extends Error=Error>(id: string, state: State): Entry<Frame, E> {
			throw "to be implemented"; //  !!! invalidate cache // notify observers
		},

		delete<E extends Error=Error>(id: string): Entry<Frame, E> {
			throw "to be implemented"; //  !!! invalidate cache // notify observers
		},


		observe(id: string, observer: () => void): () => void {

			if ( !observers.get(id)?.add(observer) ) {
				observers.set(id, new Set([observer]));
			}

			return () => observers.get(id)?.delete(observer);

		}

	});

}

