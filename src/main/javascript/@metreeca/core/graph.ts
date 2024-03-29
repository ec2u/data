/*
 * Copyright © 2020-2023 Metreeca srl
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


import { immutable, isEmpty } from "@metreeca/core/index";
import { Probe, State } from "@metreeca/core/state";
import { Entry, Error, Focus, Frame, Query } from "@metreeca/core/value";


export interface Graph {

    get<V extends Entry, E>(id: string, model: V, query?: Query): State<V, E>;


    post<V extends Frame, E>(id: string, frame: V, probe: Probe<Focus, E>): void;

    put<V extends Entry, E>(id: string, frame: V, probe: Probe<Focus, E>): void;

    del<E>(id: string, probe: Probe<Focus, E>): void;


    observe(id: string, observer: () => void): () => void;

}

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

        get<V extends Entry, D>(id: string, model: V, query?: Query): State<typeof model, D> {

            const key=!query || isEmpty(query) ? id : `${id}?${encodeURI(JSON.stringify(query))}`;


            let entry=cache.get(key) as undefined | State<V, D>;

            if ( entry ) {

                return entry;

            } else {

                const controller=new AbortController();

                cache.set(key, entry=State<V, D>({ fetch: controller.abort }));

                fetcher(key, {

                    headers: { "Accept": "application/json" },

                    signal: controller.signal

                }).then(process((response, payload) => {

                    if ( response.ok ) {

                        cache.set(key, entry=State<V, D>({

                            value: payload as V

                        }));

                    } else {

                        cache.set(key, entry=State<V, D>({

                            error: <Error<D>>immutable({

                                status: response.status,
                                reason: response.statusText,
                                detail: payload

                            })

                        }));

                    }

                    notify(id);

                }));

                return entry;

            }

        },

        post<V extends Frame, D>(id: string, frame: V, probe: Probe<{ id: string }, D>): void {

            const controller=new AbortController();


            const stash=cache.get(id);

            cache.set(id, State({ fetch: controller.abort }));

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
                        probe.value({ id });
                    }

                } else {

                    if ( stash ) { cache.set(id, stash); }

                    notify(id);

                    if ( probe.error instanceof Function ) {
                        probe.error(<Error<D>>immutable({

                            status: response.status,
                            reason: response.statusText,
                            detail: payload

                        }));
                    }

                }

            }));
        },

        put<V extends Frame, D>(id: string, frame: V, probe: Probe<Focus, D>): void {

            const controller=new AbortController();

            const stash=cache.get(id);

            cache.set(id, State({ fetch: controller.abort }));

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
                        probe.value({ id });
                    }

                } else {

                    if ( stash ) { cache.set(id, stash); }

                    notify(id);

                    if ( probe.error instanceof Function ) {
                        probe.error(<Error<D>>immutable({

                            status: response.status,
                            reason: response.statusText,
                            detail: payload

                        }));
                    }

                }

            }));

        },

        del<D>(id: string, probe: Probe<Focus, D>): void {

            const controller=new AbortController();


            const stash=cache.get(id);

            cache.set(id, State({ fetch: controller.abort }));

            notify(id);

            if ( probe.fetch instanceof Function ) {
                probe.fetch(controller.abort);
            }


            fetcher(id, {

                method: "DELETE",

                signal: controller.signal

            }).then(process((response, payload) => {

                if ( response.ok ) {

                    cache.clear(); // !!! selective purge

                    notify();

                    if ( probe.value instanceof Function ) {
                        probe.value({ id });
                    }

                } else {

                    if ( stash ) { cache.set(id, stash); }

                    notify(id);

                    if ( probe.error instanceof Function ) {
                        probe.error(<Error<D>>immutable({

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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function process<P, R>(processor: (response: Response, payload: string | P) => R): (response: Response) => Promise<R> {
    return response => {

        const mime=response.headers.get("Content-Type");

        if ( mime?.match(/^text\/plain\b/i) ) {

            return response.text()

                .catch(reason => {

                    console.error(`unreadable text payload <${reason}>`);

                    return "";

                })

                .then(text => processor(response, text));

        } else if ( mime?.match(/^application\/(ld\+)?json\b/i) ) {

            return response.json()

                .catch(reason => {

                    console.error(`unreadable JSON payload <${reason}>`);

                    return {};

                })

                .then(json => processor(response, immutable(json)));

        } else {

            return Promise

                .resolve(processor(response, <P>immutable({})));

        }

    };
}


