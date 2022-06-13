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


import { immutable } from "@metreeca/core";
import { createState, Error, Focus, Frame, Graph, Probe, process, Query, State } from "@metreeca/link/index";


export function RESTGraph(fetcher: typeof fetch=fetch): Graph {

    // !!! force error to synthetic response conversion
    // !!! TTL / size limits / …

    const cache=new Map<string, State<Frame>>(); // !!! factor
    const observers=new Map<string, Set<() => void>>();


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


    return immutable({

        get<V extends Frame, E extends Frame>(id: string, model: V, query?: Query): State<typeof model, E> {

            const key=query ? `${id}?${encodeURI(JSON.stringify(query))}` : id;


            let entry=cache.get(key) as undefined | State<V, E>;

            if ( entry ) {

                return entry;

            } else {

                const controller=new AbortController();

                controller.signal;

                cache.set(key, entry=createState<V, E>({ fetch: controller.abort }));

                fetcher(key, {

                    headers: { "Accept": "application/json" },

                    signal: controller.signal

                }).then(process((response, payload) => {

                    if ( response.ok ) {

                        cache.set(key, entry=createState<V, E>({ value: payload as V }));

                    } else {

                        const error=<Error<E>>immutable({

                            status: response.status,
                            reason: response.statusText,
                            detail: payload

                        });

                        cache.set(key, entry=createState<V, E>({ error: error }));

                    }

                    notify(id);

                }));

                return entry;

            }

        },

        post<V extends Frame, E extends Frame>(id: string, frame: V, probe: Probe<{ id: string }, E>): void {

            const controller=new AbortController();


            const stash=cache.get(id);

            cache.set(id, createState({ fetch: controller.abort }));

            notify(id);

            if ( probe.fetch instanceof Function ) {
                probe.fetch(controller.abort);
            }


            fetcher(id, {

                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(frame),

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
                        probe.error(<Error<E>>immutable({

                            status: response.status,
                            reason: response.statusText,
                            detail: payload

                        }));
                    }

                }

            }));
        },

        put<V extends Frame, E extends Frame>(id: string, frame: V, probe: Probe<Focus, E>): void {

            const controller=new AbortController();

            const stash=cache.get(id);

            cache.set(id, createState({ fetch: controller.abort }));

            notify(id);

            if ( probe.fetch instanceof Function ) {
                probe.fetch(controller.abort);
            }


            fetcher(id, {

                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(frame),

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
                        probe.error(<Error<E>>immutable({

                            status: response.status,
                            reason: response.statusText,
                            detail: payload

                        }));
                    }

                }

            }));

        },

        del<E extends Frame>(id: string, probe: Probe<Focus, E>): void {

            const controller=new AbortController();


            const stash=cache.get(id);

            cache.set(id, createState({ fetch: controller.abort }));

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
                        probe.error(<Error<E>>immutable({

                            status: response.status,
                            reason: response.statusText,
                            detail: payload

                        }));
                    }

                }

            }));

        },

        observe

    });

}


