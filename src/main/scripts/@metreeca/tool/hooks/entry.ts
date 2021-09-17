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

import { useEffect, useReducer, useState } from "react";
import { blank, Blank, Entry, Error, frame, Frame, Query, State, Value } from "../bases";
import { useGraph } from "../nests/graph";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function useEntry<V extends Frame=Frame, E extends Error=Error>(id: string, model: V, query?: Query): [

	entry: Entry<typeof model, E>,

	setEntry: {

		(state: State, action?: (location?: string) => void): void // post

		(state: typeof model, action?: (location?: string) => void): void // put

		(blank: Blank, action?: (location?: string) => void): void // delete

	}

] {

	const graph=useGraph();
	const [entry, setEntry]=useState<Entry<typeof model, E>>({});

	const [, update]=useReducer(v => v+1, 0);

	const url1=url(id, query || {});

	useEffect(() => {
		graph.get(url1, model)
			.then(setEntry)
			.catch(setEntry);
	}, [url]);

	useEffect(() => graph.observe(id, model, update), [entry]);

	return [entry, (state, action=() => {}) => {

		if ( blank(state) ) {

			graph.delete(id)
				.then(() => action(""))
				.catch(() => action());

		} else if ( frame(state) ) {

			graph.put(id, state)
				.then(() => action(""))
				.catch(() => action());

		} else {

			graph.post(id, state)
				.then(location => action(location || ""))
				.catch(() => action());

		}

	}];

}


function url(id: string, query: Query) {

	const search: any={};

	function scan(value: undefined | Value | ReadonlyArray<Value>): undefined | Value | ReadonlyArray<Value> {
		return Array.isArray(value) ? value.length && value.map(scan).filter(v => v !== undefined) as ReadonlyArray<Value>
			: value ? value : undefined;
	}

	Object.getOwnPropertyNames(query).forEach(key => {

		const value=scan(query[key]);

		if ( key.startsWith(".") ? value : value !== undefined ) {
			search[key]=value;
		}

	});

	return Object.getOwnPropertyNames(search).length ? `${id}?${encodeURIComponent(JSON.stringify(search))}` : id;
}
