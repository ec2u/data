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

import { Immutable } from "@metreeca/core";
import { Collection, Entry, Query } from "@metreeca/link";
import { NodeHint } from "@metreeca/tile/widgets/hint";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { Setter } from "@metreeca/tool/hooks";
import { useCache } from "@metreeca/tool/hooks/cache";
import { useItems, useStats } from "@metreeca/tool/nests/graph";
import { useRoute } from "@metreeca/tool/nests/router";
import { Folder } from "lucide-react";
import * as React from "react";
import { createElement, ReactNode, useEffect, useRef } from "react";
import "./items.css";


export function NodeItems<I extends Entry>({

    id,
    model,

    placeholder,

    state: [query, setQuery],

    children

}: {

    id?: string
    model: Collection<I>,

    placeholder?: ReactNode

    state: [Query, Setter<Query>],

    children: (item: Immutable<I>, index: number) => ReactNode

}) {

    const [route]=useRoute();

    const [items, loadItems]=useItems(id || route, { model }, [query, setQuery]);
    const cache=useCache(items({ value: value => value }));

    const stats=useStats(id || route, "", query);

    const loader=useRef<HTMLElement>(null);

    useEffect(() => {

        const current=loader.current;

        if ( current ) {

            const observer=new IntersectionObserver(entries => entries.forEach(entry => {

                if ( entry.isIntersecting ) { loadItems(); }

            }), {

                root: null,
                threshold: 0.25

            });

            observer.observe(current);

            return () => observer.unobserve(current);

        } else {

            return () => {};

        }

    }, [cache]);


    const none=cache && cache.length === 0;
    const more=stats({ value: ({ count }) => cache && cache.length < count });

    return createElement("node-items", {}, <>

        {cache?.map(children)}

        {items<ReactNode>({

            fetch: <NodeSpin size={"5rem"}/>,

            value:
                none ? <NodeHint>{placeholder || <Folder/>}</NodeHint>
                    : more ? <footer ref={loader}/>
                        : null,

            error: error => <span>{error.status}</span> // !!! report

        })}

    </>);
}