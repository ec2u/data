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

import { Frame, Graph, Query } from "@metreeca/link";
import { RESTGraph } from "@metreeca/link/rest";
import { Fetcher, useFetcher } from "@metreeca/tool/nests/fetcher";
import { createContext, createElement, ReactNode, useContext } from "react";


const Context=createContext<Graph>(RESTGraph());


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function NodeGraph({

	factory=fetcher => RESTGraph(fetcher),

	children

}: {

	factory?: (fetcher: Fetcher) => Graph

	children: ReactNode

}) {

	const [, fetcher]=useFetcher();

	return createElement(Context.Provider, {

		value: factory(fetcher),

		children

	});

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function useGraph(): Graph {
	return useContext(Context);
}


export function useEntry<V extends Frame, E extends Frame>(id: string, query: Query, model: V): [] {}

export function useStats<V extends Frame, E extends Frame>(id: string, path: string, [query, setQuery]: [Query, () => void]): [] {}
