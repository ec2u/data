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

import { useEffect, useReducer } from "react";
import { Blank, Entry, Error, Frame, Query, State } from "../../bases";
import { useDriver } from "../../nests/driver";
import { useRouter } from "../../nests/router";
import { Updater } from "../index";

export interface EntryUpdater {

	<E extends Error=Error>(state: State): Entry<Frame, E>; // post

	<E extends Error=Error>(state: Frame): Entry<Frame, E>; // put

	<E extends Error=Error>(blank: Blank): Entry<Frame, E>; // delete

}


export function useEntry<F extends Frame=Frame, E extends Error=Error>(
	id: string, model: F, [query, setQuery]: [Query, Updater<Query>]=[{}, () => {}]
): [
	entry: Entry<typeof model, E>, setEntry: EntryUpdater
] {

	const graph=useDriver();
	const { peek }=useRouter();
	const [, update]=useReducer(v => v+1, 0);


	const focus=id || peek();

	const entry=graph.get<F, E>(focus, model, query);


	useEffect(() => graph.observe(focus, update), [entry]);


	return [entry, (state) =>
		Object.keys(state).length === 0 ? graph.delete(focus)
			: "id" in state ? graph.put(focus, state)
				: graph.post(focus, state)
	];

}