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
import { blank, Blank, Entry, Error, frame, Frame, Query, State, url } from "../bases";
import { useGraph } from "../nests/graph";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function useEntry<V extends Frame=Frame, E extends Error=Error>(id: string, model: V, query?: Query): [

	entry: Entry<typeof model, E>,

	setEntry: {

		<E extends Error=Error>(state: State, action?: (entry: Entry<Frame, E>) => void): void // post

		<E extends Error=Error>(state: typeof model, action?: (entry: Entry<Frame, E>) => void): void // put

		<E extends Error=Error>(blank: Blank, action?: (entry: Entry<Frame, E>) => void): void // delete

	}

] {

	const graph=useGraph();
	const [entry, setEntry]=useState<Entry<typeof model, E>>({});

	const [, update]=useReducer(v => v+1, 0);

	useEffect(() => { graph.get(id, model, query).then(setEntry).catch(setEntry); }, [url(id, query)]);

	useEffect(() => graph.observe(id, model, update), [entry]);

	return [entry, (state, action=() => {}) => {

		if ( blank(state) ) {

			graph.delete(id)
				.then(() => action({}))
				.catch(action);

		} else if ( frame(state) ) {

			graph.put(id, state)
				.then(() => action({ id }))
				.catch(action);

		} else {

			graph.post(id, state)
				.then(location => () => action({ id: location || id }))
				.catch(action);

		}

	}];

}