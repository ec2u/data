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

import { Value } from "../../bases";


const Range={

	id: "",

	count: 0,

	min: {} as Value,
	max: {} as Value,

	stats: [{

		id: "",

		count: 0,

		min: {} as Value,
		max: {} as Value

	}]

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Range {

	readonly type?: string;

	readonly min?: Value;
	readonly max?: Value;

	readonly lower?: Value;
	readonly upper?: Value;

}

export interface RangeUpdater {

	(range?: { lower?: Value, upper?: Value }): void;

}


// export function useRange(
// 	id: string, path: string, [query, setQuery]: [Query, Updater<Query>]=[{}, () => {}]
// ): [Range, RangeUpdater] {
//
// 	const gte=`>=${path}`;
// 	const lte=`<=${path}`;
//
// 	const queryElement=query[gte];
// 	const lower=single(queryElement);
// 	const upper=single(query[lte]);
//
// 	const entry=useEntry(id, Range, {
// 		...query, ".stats": path, ".order": undefined, ".offset": undefined, ".limit": undefined
// 	});
//
// 	const range=entry.data(({ stats: [stat] }) => ({
//
// 		type: stat?.id,
//
// 		min: stat?.min,
// 		max: stat?.max,
//
// 		lower,
// 		upper
//
// 	}));
//
// 	return [range, range => {
//
// 		if ( range === undefined ) { // clear
//
// 			setQuery({ ...query, [lte]: undefined, [gte]: undefined, ".offset": 0 });
//
// 		} else { // set
//
// 			setQuery({ ...query, [lte]: single(range.lower), [gte]: single(range.upper), ".offset": 0 });
//
// 		}
//
// 	}];
//
// }



