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

import { frame, langs, Plain, string, Value } from "../bases";

const Items=({

	id: "",

	terms: [{

		id: "", // !!! review

		value: {} as Value,

		count: 0

	}]

});

export function focus(value: Value, locales: string[]=["en"]): Plain {
	return frame(value) ? value.id
		: langs(value) ? string(value, locales)
			: value;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// export interface Items extends ReadonlyArray<{
//
// 	readonly selected: boolean
// 	readonly value: Value
// 	readonly count: number
//
// }> {}
//
// export interface ItemsUpdater {
//
// 	(items?: { value: Value, selected: boolean }): void;
//
// }
//
//
// export function useItems(id: string, path: string, [query, setQuery]: [Query, Updater<Query>]=[{}, () => {}]): [Items, ItemsUpdater] {
//
// 	const any=`?${path}`;
//
// 	const selection=new Set(Object
// 		.getOwnPropertyNames(query)
// 		.filter(key => key === path || key === any)
// 		.map(key => query[key])
// 		.flatMap(value => Array.isArray(value) ? value : [value])
// 		.map(focus)
// 	);
//
//
// 	const baseline=useTerms(id, path); // computed ignoring all facets
//
// 	const matching=useTerms(id, path, Object // computed ignoring this facet
// 		.getOwnPropertyNames(query)
// 		.filter(key => key !== path && key !== any)
// 		.reduce((object, key, index, keys) => {
//
// 			(object as any)[key]=query[key];
//
// 			return object;
//
// 		}, {})
// 	);
//
//
// 	const items=matching.data(({ terms: matching }) => baseline.data(({ terms: baseline }) => [
//
// 		...matching, ...baseline
// 			.filter(term => !matching.some(match => focus(term.value) === focus(match.value)))
// 			.map(term => ({ ...term, count: 0 }))
//
// 	])).map(term => ({ ...term, selected: selection.has(focus(term.value)) }));
//
// 	return [items, item => {
//
// 		if ( item === undefined ) { // clear
//
// 			setQuery({ ...query, [path]: undefined, [any]: undefined, ".offset": 0 });
//
// 		} else { // set
//
// 			const update: Set<Plain>=new Set(selection);
//
// 			if ( item.selected ) {
// 				update.add(focus(item.value));
// 			} else {
// 				update.delete(focus(item.value));
// 			}
//
// 			setQuery({ ...query, [path]: [...update], [any]: undefined, ".offset": 0 });
//
// 		}
//
// 	}];
//
// }
