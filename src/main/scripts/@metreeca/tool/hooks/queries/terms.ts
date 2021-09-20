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

import { frame, freeze, langs, Plain, Query, string, Value } from "../../bases";
import { Updater } from "../index";
import { useFrame } from "./frame";


const Terms=freeze({

	id: "",

	terms: [{

		id: "",

		value: {},

		count: 0

	}]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Terms extends ReadonlyArray<{

	readonly selected: boolean
	readonly value: Value
	readonly count: number

}> {}

export interface TermsUpdater {

	(items: { value: Value, selected: boolean } /*| { value: Value, selected: boolean }[]*/): void;

}


export function useTerms(
	id: string, path: string, [query, setQuery]: [Query, Updater<Query>]=[{}, () => {}]
): [
	terms: Terms, setTerms: TermsUpdater
] {

	const any=`?${path}`;

	const selection=new Set(Object
		.getOwnPropertyNames(query)
		.filter(key => key === path || key === any)
		.map(key => query[key])
		.flatMap(value => Array.isArray(value) ? value : [value])
		.map(focus)
	);


	const [{ terms: baseline }]=useFrame(id, Terms, [{ // computed ignoring all facets

		".terms": path

	}, setQuery]);

	const [{ terms: matching }]=useFrame(id, Terms, [{ // computed ignoring this facet

		...query,

		".terms": path,

		[path]: undefined,
		[any]: undefined,

		".order": undefined,
		".offset": undefined,
		".limit": undefined

	}, setQuery]);

	const items=[...matching, ...baseline

		.filter(item => !matching.some(match => focus(item.value) === focus(match.value)))
		.map(item => ({ ...item, count: 0 }))

	]
		.map(term => ({ ...term, selected: selection.has(focus(term.value)) }))
		.sort(sort);


	return [items, items => {

		if ( items === undefined ) { // clear

			setQuery({ ...query, [path]: undefined, [any]: undefined, ".offset": 0 });

		} else { // set

			const update: Set<Plain>=new Set(selection);

			if ( items.selected ) {
				update.add(focus(items.value));
			} else {
				update.delete(focus(items.value));
			}

			setQuery({ ...query, [path]: [...update], [any]: undefined, ".offset": 0 });

		}

	}];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function focus(value: Value): Plain {
	return frame(value) ? value.id
		: langs(value) ? string(value) // !!! locales?
			: value;
}

function sort(x: Terms[number], y: Terms[number]): number {
	return x.selected && !y.selected ? -1 : !x.selected && y.selected ? +1
		: x.count > y.count ? -1 : x.count < y.count ? +1
			: string(x.value).toUpperCase().localeCompare(string(y.value).toUpperCase());
}


