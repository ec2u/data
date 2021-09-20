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

import { Graph } from "./index";

export function MockGraph({

	delay=1000

}: Partial<{

	delay: number

}>={}): Graph {

	throw ";( to be implemented";

	// const cache: { [id: string]: any }={};
	//
	// const observers=new Set<(frame?: Frame) => void>();
	//
	//
	// function notify(frame?: Frame) {
	// 	observers.forEach(observer => observer(frame));
	// }
	//
	//
	// return freeze({
	//
	// 	get<V extends Frame=Frame>(id: string, model: V, query?: Query): Promise<typeof model> {
	// 		return cache[id] || (cache[id]=model);
	// 	},
	//
	//
	// 	post(id: string, state: State): Promise<string> {
	// 		throw new Error("to be implemented");
	// 	},
	//
	// 	put(id: string, state: State): Promise<void> {
	// 		throw new Error("to be implemented");
	// 	},
	//
	// 	delete(id: string): Promise<void> {
	// 		throw new Error("to be implemented");
	// 	},
	//
	//
	// 	observe(id: string, model: Frame, observer: (frame?: Frame) => void): () => void {
	//
	// 		observers.add(observer);
	//
	// 		return () => observers.delete(observer);
	//
	// 	}
	//
	// });

}