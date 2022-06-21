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

import { Query, string } from "@metreeca/link";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { Setter } from "@metreeca/tool/hooks";
import { useCache } from "@metreeca/tool/hooks/cache";
import { useStats } from "@metreeca/tool/nests/graph";
import * as React from "react";
import { createElement } from "react";
import "./count.css";


export function NodeCount({

    id,
    path="",

    state: [query, setQuery]

}: {

    id: string,
    path?: string,

    state: [Query, Setter<Query>]

}) {


    const stats=useStats(id, path);
    const count=useCache(stats({ value: ({ count }) => count }));

    return createElement("node-count", {},

        count === undefined ? <NodeSpin/>
            : count === 0 ? "no matches"
                : count === 1 ? "1 match"
                    : `${string(count)} matches`
    );

}
