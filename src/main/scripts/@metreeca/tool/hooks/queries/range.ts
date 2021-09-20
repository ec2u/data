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

import { frame, freeze, Plain, Query, string, value, Value } from "../../bases";
import { Updater } from "../index";
import { useFrame } from "./frame";


const Stats=freeze({

	id: "",

	count: 0,

	min: {},
	max: {},

	stats: [{

		id: "",

		count: 0,

		min: {},
		max: {}

	}]

});


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
	id: string, path: string, [query, setQuery]: [Query, Updater<Query>]=[{}, () => {}]
): [
	range: Range, setRange: RangeUpdater
] {

	const gte=`>=${path}`;
	const lte=`<=${path}`;

	const lower=value(query[gte]);
	const upper=value(query[lte]);


	const [{ count, stats: [stats] }]=useFrame(id, Stats, [{

		...query,

		".stats": path,

		".order": undefined,
		".offset": undefined,
		".limit": undefined

	}, setQuery]);


	return [{

		count,

		type: stats?.id,

		min: stats?.min,
		max: stats?.min,

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

				[lte]: plain(value(range.lower)),
				[gte]: plain(value(range.upper)),

				".offset": 0 // reset pagination

			});

		}

	}];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function plain(value: undefined | Value): undefined | Plain {
	return frame(value) ? value.id : string(value);
}


