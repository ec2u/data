/*
 * Copyright © 2020-2021 Metreeca srl
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

import { createContext, createElement, ReactNode, useContext } from "react";
import { Graph } from "../bases";
import { RESTGraph } from "../bases/rest";

const GraphContext=createContext<Graph>(RESTGraph());


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function useGraph(): Graph {
	return useContext(GraphContext);
}

export function ToolGraph(props: {

	value: Graph

	children: ReactNode

}) {

	return createElement(GraphContext.Provider, props);

}