/*
 * Copyright © 2020-2022 Metreeca srl
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


import { immutable, isEmpty } from "@metreeca/core";
import { Entry, Graph } from "@metreeca/link/index";
import { Fetcher } from "@metreeca/tool/nests/fetcher";


export function RESTGraph(fetcher: Fetcher=fallback()): Graph {

	// !!! force error to synthetic response conversion
	// !!! TTL / size limits / …

	const cache=new Map<string, Entry<unknown, unknown>>(); // !!! factor


	const observers=new Map<string, Set<() => void>>(); // !!! factor


	function observe(id: string, observer: () => void): () => void {

		if ( !observers.get(id)?.add(observer) ) {
			observers.set(id, new Set([observer]));
		}

		return () => observers.get(id)?.delete(observer);

	}

	function notify(id?: string) {
		if ( id === undefined ) {

			observers.forEach(observers => observers.forEach(observer => observer()));

		} else {

			observers.get(id)?.forEach(observer => observer());

		}
	}


	const graph=immutable({

		get<V, E>(id: string, model: V, query: string, probe?: EntryProbe<typeof model, E>): Entry<typeof model, E> {

			const key=query ? `${id}?${query}` : id;  // !!! parametrize converter


			let entry=cache.get(key) as Maybe<Entry<V, E>>;

			if ( entry ) {

				if ( probe ) { entry(probe); }

			} else {

				const controller=new AbortController();

				controller.signal;

				cache.set(key, entry=createEntry<V, E>({ fetch: controller.abort }));

				if ( probe ) { entry(probe); }


				fetcher(key, {

					headers: { "Accept": "application/json" },

					signal: controller.signal

				}).then(process((response, payload) => {

					if ( response.ok ) {

						cache.set(key, entry=createEntry<V, E>({ value: payload as V }));

						if ( probe ) { entry(probe); }

					} else {

						const report=<Report<E>>frozen({

							status: response.status,
							reason: response.statusText,
							detail: payload

						});

						cache.set(key, entry=createEntry<V, E>({ error: report }));

						if ( probe ) { entry(probe); }

					}

					notify(id);

				}));

			}

			return entry;

		},

		post<V, E>(id: string, state: V, probe: EntryProbe<Focus, E>): void {

			const controller=new AbortController();


			const stash=cache.get(id);

			cache.set(id, createEntry({ fetch: controller.abort }));

			notify(id);

			if ( probe.fetch instanceof Function ) {
				probe.fetch(controller.abort);
			}


			fetcher(id, {

				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(state),

				signal: controller.signal

			}).then(process((response, payload) => {

				if ( response.ok ) {

					cache.clear(); // !!! selective purge

					notify();

					if ( probe.value instanceof Function ) {
						probe.value(response.status === 201 // Created
							? { id: response.headers.get("Location") || id }
							: payload as any
						);
					}

				} else {

					if ( stash ) { cache.set(id, stash); }

					notify(id);

					if ( probe.error instanceof Function ) {
						probe.error(<Report<E>>frozen({

							status: response.status,
							reason: response.statusText,
							detail: payload

						}));
					}

				}

			}));
		},

		put<V, E>(id: string, state: V, probe: EntryProbe<Focus, E>): void {

			const controller=new AbortController();


			const stash=cache.get(id);

			cache.set(id, createEntry({ fetch: controller.abort }));

			notify(id);

			if ( probe.fetch instanceof Function ) {
				probe.fetch(controller.abort);
			}


			fetcher(id, {

				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(state),

				signal: controller.signal

			}).then(process((response, payload) => {

				if ( response.ok ) {

					cache.clear(); // !!! selective purge

					notify();

					if ( probe.value instanceof Function ) {
						probe.value({ id: id });
					}

				} else {

					if ( stash ) { cache.set(id, stash); }

					notify(id);

					if ( probe.error instanceof Function ) {
						probe.error(<Report<E>>frozen({

							status: response.status,
							reason: response.statusText,
							detail: payload

						}));
					}

				}

			}));

		},

		del<E>(id: string, probe: EntryProbe<Focus, E>): void {

			const controller=new AbortController();


			const stash=cache.get(id);

			cache.set(id, createEntry({ fetch: controller.abort }));

			notify(id);

			if ( probe.fetch instanceof Function ) { probe.fetch(controller.abort); }


			fetcher(id, {

				method: "DELETE",

				signal: controller.signal

			}).then(process((response, payload) => {

				if ( response.ok ) {

					cache.clear(); // !!! selective purge

					notify();

					if ( probe.value instanceof Function ) {
						probe.value({ id: id.substring(0, id.lastIndexOf("/")+1) });
					}

				} else {

					if ( stash ) { cache.set(id, stash); }

					notify(id);

					if ( probe.error instanceof Function ) {
						probe.error(<Report<E>>frozen({

							status: response.status,
							reason: response.statusText,
							detail: payload

						}));
					}

				}

			}));

		},


		bulk<V, E>({ del, put, post, get }: Bulk<V>, probe?: EntryProbe<V, Report<E>[]>): Entry<V, Report<E>[]> {

			const aborts: Map<string, () => void>=new Map();
			const errors: Report<E>[]=[];


			function getEntry() {
				return createEntry({

					fetch: aborts.size === 0 ? undefined : () => {

						try { aborts.forEach(abort => abort()); } finally { aborts.clear(); }

					},

					value: aborts.size > 0 || errors.length > 0 ? undefined : {

						...(get as any)?.model, id: "" // !!! review model usage

					},

					error: aborts.size > 0 || errors.length === 0 ? undefined : {

						status: 207,
						reason: "Multi-Status",

						detail: errors

					}

				});
			}


			if ( del ) {

				if ( isArray(del) ) {

					del.map(value => {

						if ( isFocus(value) ) {

							return value.id;

						} else if ( isString(value) ) {

							return value;

						} else {

							throw new RangeError(`malformed bulk del targets <${del}>`);

						}

					}).forEach(id => graph.del<E>(id, {

						fetch: abort => {

							aborts.set(id, abort);

						},

						value: () => {

							aborts.delete(id);

							if ( probe ) {
								getEntry()(probe);
							}

						},

						error: error => {

							aborts.delete(id);
							errors.push(error);

							if ( probe ) {
								getEntry()(probe);
							}

						}

					}));

				} else {

					throw new RangeError(`malformed bulk del targets <${del}>`);

				}

			}

			if ( put ) {
				throw new Error("unsupported bulk <put> operations");
			}

			if ( post ) {
				throw new Error("unsupported bulk <post> operations");
			}

			if ( get ) {
				throw new Error("unsupported bulk <get> operations");
			}

			if ( del && !isEmpty(del) || put && !isEmpty(put) || post && !isEmpty(post) ) {

				cache.clear(); // !!! selective purge

				notify();

			}

			const bulk=getEntry();

			if ( probe ) { bulk(probe); }

			return bulk;

		},


		purge(id: string): void {

			cache.clear(); // !!! selective purge

			notify();

		},

		observe

	});

	return graph;

}
