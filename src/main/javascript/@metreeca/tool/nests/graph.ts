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

import { Immutable, isString } from "@metreeca/core";
import { Collection, DataTypes, Entry, Error, Graph, isFocus, isLiteral, Literal, Query, State, Stats, string, Terms, Value } from "@metreeca/link";
import { RESTGraph } from "@metreeca/link/rest";
import { Setter } from "@metreeca/tool/hooks";
import { useUpdate } from "@metreeca/tool/hooks/update";
import { Fetcher, useFetcher } from "@metreeca/tool/nests/fetcher";
import { createContext, createElement, ReactNode, useContext, useEffect, useMemo, useState } from "react";


const Context=createContext<Graph>(RESTGraph());


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Range {

    readonly min?: Literal;
    readonly max?: Literal;

    readonly gte?: Literal;
    readonly lte?: Literal;

}

export interface RangeDelta {

    readonly gte?: Literal;
    readonly lte?: Literal;

}


export interface Options extends Immutable<Array<{

    readonly value: Value;
    readonly count: number;

    readonly selected?: boolean;

}>> {}

export interface OptionsDelta extends Immutable<Array<{

    readonly value: Literal;

    readonly selected: boolean;

}>> {}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * **Warning** / The `factory` argument must have a stable identity
 *
 * @param factory
 * @param children
 *
 * @constructor
 */
export function NodeGraph({

    factory=RESTGraph,

    children

}: {

    factory?: (fetcher: Fetcher) => Graph

    children: ReactNode

}) {

    const [, fetcher]=useFetcher();

    const graph=useMemo(() => factory(fetcher), [factory, fetcher]);

    return createElement(Context.Provider, {

        value: graph,

        children

    });

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function useGraph(): Graph {
    return useContext(Context);
}


export function useEntry<V extends Entry, E>(id: string, model: V, query: Query={}): State<typeof model, E> {

    const graph=useGraph();
    const update=useUpdate();

    useEffect(() => graph.observe(id, update), [id, JSON.stringify(query)]);

    return graph.get<V, E>(id, model, query);

}

export function useTerms<E>(id: string, path: string, query: Query): State<Terms, E> {

    return useEntry(id, ({

        id: "",

        terms: [{

            value: "",
            count: 0

        }]

    }), { ...query, ".terms": path });

}

export function useStats<E>(id: string, path: string, query: Query): State<Stats, E> {

    return useEntry(id, {

        id: "",
        count: 0,

        min: undefined,
        max: undefined,

        stats: [{

            id: "",
            count: 0,

            min: "",
            max: ""

        }]

    }, { ...query, ".stats": path });

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function useKeywords(
    id: string,
    path: string,
    [query, setQuery]: [Query, Setter<Query>]
): [string, Setter<string>] {

    const filter=`~${path}`;
    const keywords=query[filter];

    return [isString(keywords) ? keywords.trim() : "", keywords => setQuery({

        ...query, [filter]: keywords.trim() || undefined

    })];

}

export function useRange<E>(
    id: string,
    path: string,
    type: keyof typeof DataTypes,
    [query, setQuery]: [Query, Setter<Query>]
): [State<Range>, Setter<null | RangeDelta>] {

    const lower=`>=${path}`;
    const upper=`<=${path}`;

    const gte=asLiteral(query[lower]);
    const lte=asLiteral(query[upper]);

    const stats=useStats<E>(id, path, query);

    return [

        mapState(stats, ({ stats }) => {

            const entry=stats?.filter(({ id }) => id === DataTypes[type])[0];

            const min=asLiteral(entry?.min);
            const max=asLiteral(entry?.max);

            return { min, max, gte, lte };

        }),

        delta => setQuery({

            ...query,

            [lower]: delta === null ? undefined : "gte" in delta ? delta.gte : query[lower],
            [upper]: delta === null ? undefined : "lte" in delta ? delta.lte : query[upper]

        })

    ];

}

export function useOptions(
    id: string,
    path: string,
    type: keyof typeof DataTypes,
    {

        keywords,
        offset,
        limit

    }: {


        keywords?: string,
        offset: number,
        limit: number

    },
    [query, setQuery]: [Query, Setter<Query>]
): [State<Options>, Setter<null | OptionsDelta>
] {

    const filter=`?${path}`;

    const constraint=query[path] || query[filter] || [];
    const selection=isLiteral(constraint) ? [constraint] : constraint;

    const head={

        ".limit": offset+limit,

        [type === "reference" ? `~${path}.label` : `~${path}`]: keywords

    };


    const baseline=useTerms(id, path, { // ignoring all facets

        ...head

    });

    const selected=useTerms(id, path, { // including this facet

        ...head, ...Object.entries(query)

            .filter(([key]) => !key.startsWith("."))
            .reduce((current, [key, value]) => ({ ...current, [key]: value }), {})

    });

    const matching=useTerms(id, path, { // ignoring this facet

        ...head, ...Object.entries(query)

            .filter(([key]) => !key.startsWith(".") && key !== path && key !== filter)
            .reduce((current, [key, value]) => ({ ...current, [key]: value }), {})

    });


    const value=flatMapState(baseline, ({ terms }) => {

        const baseline=terms ?? [];

        return flatMapState(selected, ({ terms }) => {

            const selected=terms ?? [];

            return mapState(matching, ({ terms }) => {

                    const matching=terms ?? [];

                    return [

                        ...selected,

                        ...matching
                            .filter(term => !selected.some(match => equals(term.value, match.value))),

                        ...baseline
                            .filter(term => !selected.some(match => equals(term.value, match.value)))
                            .filter(term => !matching.some(match => equals(term.value, match.value)))
                            .map(term => ({ ...term, count: 0 }))

                    ]

                        .map(term => ({

                            ...term, selected: selection.some(value =>
                                isFocus(term.value) ? term.value.id === value : term.value === value
                            )

                        }))

                        .sort((x, y): number =>
                            x.selected && !y.selected ? -1 : !x.selected && y.selected ? +1
                                : x.count > y.count ? -1 : x.count < y.count ? +1
                                    : string(x.value).toUpperCase().localeCompare(string(y.value).toUpperCase())
                        )

                        .slice(offset, offset+limit);

                }
            );


        });

    });

    const updater=(terms: null | OptionsDelta) => {

        if ( terms === null ) {

            setQuery({ ...query, [path]: undefined });

        } else {

            const stable=selection.filter(selected => terms.every(({ value }) => !equals(selected, value)));
            const added=terms.filter(({ selected }) => selected).map(({ value }) => value);

            const update=[

                ...stable,
                ...added

            ];

            setQuery({ ...query, [path]: update.length > 0 ? update : undefined });

        }

    };

    return [value, updater];
}

export function useItems<I extends Entry, D>(
    id: string,
    { model, limit=10 }: { model: Collection<I>, limit?: number },
    [query, setQuery]: [Query, Setter<Query>]
): [State<Exclude<typeof model.contains, undefined>, D>, () => void] {

    const graph=useGraph();

    const [pages, setPages]=useState<State<typeof model, D>[]>([]);


    function get(page: number) {
        return graph.get<typeof model, D>(id, model, { ...query, ".offset": page*limit, ".limit": limit });
    }


    // reset on query updates

    useEffect(() => {

        setPages([get(0)]);

    }, [id, JSON.stringify(query)]);


    // update pending pages

    useEffect(() => {

        return graph.observe(id, () => setPages(pages.map((state, index) => state({

            fetch: () => get(index),

            other: () => state

        }))));

    }, [id, JSON.stringify(pages.map(page => page({ value: true, other: false })))]);


    // merge states

    const fetch=pages.reduce<undefined | (() => void)>((aborts, page) => page({

        fetch: abort => aborts

            ? () => {
                abort();
                aborts();
            }

            : abort,

        other: aborts

    }), undefined);

    const error=pages.reduce<undefined | Error<D>>((errors, page) => page({

        error: error => errors ?? error,

        other: errors

    }), undefined);

    const value=pages.reduce<Exclude<typeof model.contains, undefined>>((values, page) => page({

        value: ({ contains }) => contains ? [...values, ...contains] : values,

        other: values

    }), []);


    return [

        fetch ? State<Exclude<typeof model.contains, undefined>, D>({ fetch })
            : error ? State<Exclude<typeof model.contains, undefined>, D>({ error })
                : State<Exclude<typeof model.contains, undefined>, D>({ value }),


        () => {

            if ( pages.every(page => page({

                value: ({ contains }) => contains && contains.length > 0,

                other: false

            })) ) {

                setPages([...pages, get(pages.length)]);

            }

        }

    ];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function equals(x: Value, y: Value): boolean {
    return isFocus(x) && isFocus(y) ? equals(x.id, y.id) : x === y;
}


//// !!! ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

function asLiteral(value: unknown): undefined | Literal {
    return isLiteral(value) ? value : undefined;
}


function mapState<V, R, E>(state: State<V, E>, mapper: (value: V) => R): State<R, E> {

    return flatMapState(state, (value: V) => State<R, E>({ value: mapper(value) }));

}

function flatMapState<V, R, E>(state: State<V, E>, mapper: (value: V) => State<R, E>): State<R, E> {

    return state({

        fetch: (abort: () => void) => State<R, E>({ fetch: abort }),

        value: mapper,

        error: (error: Error<E>) => State<R, E>({ error })

    });

}
