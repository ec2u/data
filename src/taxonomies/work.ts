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
import { flatMap, map, take } from "@metreeca/pipe/tasks";
import { type Options, parse } from "csv-parse";


const DataURL = "taxonomies-ec2u-isced-2011";


if ( import.meta.main ) {
	// !!!
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

interface Concept {

	readonly id: string;
	readonly label: string;
	readonly alternative: string;
	readonly definition: string;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const url = await secret(DataURL);

// !!! service injection

const concepts = await pipe(
	(items(url))
	(map(fetch)) // !!! caching
	(csv<Concept>())
	(take(3))
	(toArray())
);

console.log(concepts);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a task parsing CSV responses into records.
 *
 * @typeParam R The type of the parsed records
 *
 * @param options The `csv-parse` options, overriding the header-keyed defaults
 *
 * @returns A task flattening the body of each response into the records it holds
 */
function csv<R>(options: Options = {}): Task<Response, R> {
	return flatMap(async response => parse(await response.text(), {

		columns: true, skip_empty_lines: true, trim: true, ...options

	}));
}

// !!! return type
//
//  with `columns`: Record<string, string> and no casting, each record is exactly a Record<string,
//   string>.
//
//   Three things that break the guarantee, all reachable through the spread ...options:
//
//   - cast: true (or a CastingFunction) — values stop being strings.
//   - columns: false — records become string[] instead of objects.
//   - relax_column_count_less: true — short rows omit the trailing keys entirely, so a
//     Record<string, string> index lies unless noUncheckedIndexedAccess is on. At the
//     defaults a ragged row throws CSV_RECORD_INCONSISTENT_COLUMNS instead, which is why
//     the plain shape holds today.
