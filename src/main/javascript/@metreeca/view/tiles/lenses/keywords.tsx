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

import { Query } from "@metreeca/core/value";
import { Setter } from "@metreeca/view/hooks";
import { useKeywords } from "@metreeca/view/nests/graph";
import { useRoute } from "@metreeca/view/nests/router";
import { NodeSearch } from "@metreeca/view/tiles/inputs/search";
import * as React from "react";
import { createElement } from "react";
import "./keywords.css";


export function NodeKeywords({

    id,
    path="label",

    placeholder="Search",

    state: [query, setQuery]

}: {

    id?: string,
    path?: string,

    placeholder?: string

    state: [Query, Setter<Query>]

}) {

    const [route]=useRoute();

    const [keywords, setKeywords]=useKeywords(id || route, path, [query, setQuery]);

    return createElement("node-keywords", {},
        <NodeSearch icon placeholder={placeholder} auto state={[keywords, setKeywords]}/>
    );

}
