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

import { isString } from "@metreeca/core";
import { Frame, Graph, Query, Range, State, Stats } from "@metreeca/link";
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

export function useEntry<V extends Frame, E extends Frame=Frame>(
    id: string, model: V, [query, setQuery]: [Query, Setter<Query>]=[{}, () => {}]
): [
    State<V, E>, Setter<Query>
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
        setQuery({ [`~${path}`]: keywords.trim() ? keywords.trim() : undefined });
    }];

}

export function useStats<V extends Frame, E extends Frame>(
    id: string, path: string, [query, setQuery]: [Query, Setter<Query>]
): [
    State<Stats>, Setter<Range>
] {

    const [entry, setEntry]=useEntry<Stats>(id, {

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

        [`>=${path}`]: min,
        [`<=${path}`]: max

    })];

}
