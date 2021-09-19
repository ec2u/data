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

import { first, frame, Plain, Query, string, Value } from "../../bases";
import { Updater } from "../index";
import { useFrame } from "./frame";


const Range={

	id: "",

	count: 0,

	min: {} as Value,
	max: {} as Value,

	stats: [{ // !!! rename

		id: "",

		count: 0,

		min: {} as Value,
		max: {} as Value

	}]

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Range {

	readonly count: number;

	readonly type?: string;

	readonly min?: Value;
	readonly max?: Value;

	readonly lower?: Value;
	readonly upper?: Value;

}

export interface RangeUpdater {

	(range?: { lower?: Value, upper?: Value }): void;

}


export function useRange(
	id: string, path: string,
	[query, setQuery]: [Query, Updater<Query>]=[{}, () => {}]
): [

	Range,
	RangeUpdater

] {

	const gte=`>=${path}`;
	const lte=`<=${path}`;

	const lower=first(query[gte]);
	const upper=first(query[lte]);


	const [{ count, stats: [{ id: type, min, max }] }]=useFrame(id, Range, [{

		...query,

		".stats": path,

		".order": undefined,
		".offset": undefined,
		".limit": undefined

	}, setQuery]);

	return [{

		count,

		type,

		min,
		max,

		lower,
		upper

	}, range => {

		if ( range === undefined ) { // clear

			setQuery({

				...query,

				[lte]: undefined,
				[gte]: undefined,

				".offset": 0 // reset pagination

			});

		} else { // set

			setQuery({

				...query,

				[lte]: plain(first(range.lower)),
				[gte]: plain(first(range.upper)),

				".offset": 0 // reset pagination

			});

		}

	}];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function plain(value: undefined | Value): undefined | Plain {
	return frame(value) ? value.id : string(value);
}


