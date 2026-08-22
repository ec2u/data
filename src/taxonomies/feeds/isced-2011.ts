/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { secret } from "@/_/gcp/secrets.js";
import { pipe, type Task } from "@metreeca/pipe";
import { items } from "@metreeca/pipe/feeds";
import { toArray } from "@metreeca/pipe/sinks";
import { flatMap, map, peek, take } from "@metreeca/pipe/tasks";
import { parse } from "csv-parse";


const DataURL = "taxonomies-ec2u-isced-2011";


if ( import.meta.main ) {
	run();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

type Concept = {

	readonly id: string;
	readonly label: string;
	readonly alternative: string;
	readonly definition: string;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function run() {

	const url = await secret(DataURL);

	// !!! service injection
	// !!! fetcher
	// !!! caching

	const concepts = await pipe(
		(items(url))
		(map(fetch))
		(csv<Concept>({ header: true, skip: true, trim: true }))
		(take(3))
		(toArray())
	);

	console.log(concepts);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Record = {

	readonly [label: string]: string

}


export function csv<R extends Record=Record>({

	header,

	skip,
	trim

}: {

	readonly header?: boolean

	readonly skip?: boolean
	readonly trim?: boolean

} = {}): Task<Response, R> {

	return flatMap(async response => parse(await response.text(), {

		columns: header === true,

		skipEmptyLines: skip === true,
		trim: trim === true

	}));

}
