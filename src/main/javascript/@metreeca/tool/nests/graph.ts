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
import { Entry, Focus, Frame, Graph, isFocus, isLiteral, Literal, Query, State, string, Value } from "@metreeca/link";
import { RESTGraph } from "@metreeca/link/rest";
import { Setter } from "@metreeca/tool/hooks";
import { useUpdate } from "@metreeca/tool/hooks/update";
import { Fetcher, useFetcher } from "@metreeca/tool/nests/fetcher";
import { createContext, createElement, ReactNode, useContext, useEffect, useMemo } from "react";


const Context=createContext<Graph>(RESTGraph());


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 **Warning** / The `factory` argument must have a stable identity
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

export function useEntry<V extends Entry, E>(
    id: string, model: V, [query, setQuery]: [Query, Setter<Query>]=[{}, () => {}]
): [
    State<typeof model, E>, Setter<Query>
] {

    const graph=useGraph();
    const update=useUpdate();

    useEffect(() => graph.observe(id, update), [id, JSON.stringify(query)]);

    return [graph.get<V, E>(id, model, query), delta => setQuery({ ...query, ...delta })];

}


export function useKeywords(
    id: string, path: string, [query, setQuery]: [Query, Setter<Query>]
): [
    string, Setter<string>
] {

    const keywords=query[`~${path}`];

    return [isString(keywords) ? keywords.trim() : "", keywords => {
        setQuery({ ...query, [`~${path}`]: keywords.trim() || undefined });
    }];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Stats {

    readonly count: number;

    readonly min?: Value;
    readonly max?: Value;

    readonly stats: Immutable<Array<{

        readonly id: string;
        readonly count: number;

        readonly min?: Value
        readonly max?: Value

    }>>;

}

export interface StatsQuery {

    readonly min?: Literal,
    readonly max?: Literal

}

export function useStats<V extends Frame, E extends Frame>(
    id: string, path: string, [query, setQuery]: [Query, Setter<Query>]
): [
    State<Stats>, Setter<StatsQuery>
] {

    const [entry, setEntry]=useEntry(id, {

        id: "",
        count: 0,

        min: undefined,
        max: undefined,

        stats: [{

            id: "",
            count: 0,

            min: undefined,
            max: undefined

        }]

    }, [{ ...query, ".stats": path }, setQuery]);

    return [entry, ({ min, max }) => setEntry({

        ...query,

        [`>=${path}`]: min,
        [`<=${path}`]: max

    })];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Terms extends Immutable<Array<{

    readonly value: Value;
    readonly count: number;

    readonly selected?: boolean;

}>> {}

export interface TermsQuery extends Immutable<Array<{

    readonly value: Literal;

    readonly selected: boolean;

}>> {}

export function useTerms(
    id: string,
    {

        path,

        keywords,
        offset,
        limit

    }: {

        path: string,

        keywords?: string,
        offset?: number,
        limit?: number

    },
    [query, setQuery]: [Query, Setter<Query>]
): [

    State<Terms>, Setter<TermsQuery>

] {

    const model=({

        id: "",

        terms: [{

            value: "",
            count: 0

        }]

    });

    const constraint=query[path] || query[`?${path}`] || [];
    const selection=isLiteral(constraint) ? [constraint] : constraint;

    const [baseline]=useEntry(id, model, [{ // ignoring all facets // !!! review offset/limit

        ".terms": path,

        ".offset": offset,
        ".limit": limit


    }, setQuery]);

    const [matching]=useEntry(id, model, [{ // ignoring this facet

        ".terms": path,

        ".offset": offset,
        ".limit": limit,

        ...Object.entries(query)
            .filter(([key]) => !key.startsWith(".") && key !== path && key !== `?${path}`)
            .reduce((current, [key, value]) => ({ ...current, [key]: value }), {})

    }, setQuery]);


    const value=baseline({

        fetch: abort => State<Terms>({ fetch: abort }),

        error: error => State<Terms>({ error }),

        value: ({ terms: baseline }) => matching({

            fetch: abort => State<Terms>({ fetch: abort }),

            error: error => State<Terms>({ error }),

            value: ({ terms: matching }) => State<Terms>({

                value: [...matching, ...baseline

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
            })

        })

    });

    const updater=(terms: TermsQuery) => {

        const stable=selection.filter(selected => terms.every(({ value }) => !equals(selected, value)));
        const added=terms.filter(({ selected }) => selected).map(({ value }) => value);

        const update=[

            ...stable,
            ...added

        ];

        return setQuery({ ...query, [path]: update.length > 0 ? update : undefined });
    };

    return [value, updater];
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function equals(x: Literal | Focus, y: Literal | Focus): boolean {
    return isFocus(x) && isFocus(y) ? equals(x.id, y.id) : x === y;
}
