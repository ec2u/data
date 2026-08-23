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
import { csv } from "@/_/flow/formats/csv/index.js";
import { immutable } from "@metreeca/core/structures";
import { pipe } from "@metreeca/pipe";
import { items } from "@metreeca/pipe/feeds";
import { forEach, toArray } from "@metreeca/pipe/sinks";
import { flatMap, map, take } from "@metreeca/pipe/tasks";
import { log } from "@metreeca/tape";
import type { ReadableStream } from "node:stream/web";


const DataURL = "taxonomies-ec2u-isced-2011";

const CSVFormat = immutable({

	header: true,
	skip: true,
	trim: true

});


if ( import.meta.main ) {
	sync();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

type Concept = {

	readonly id: string;
	readonly label: string;
	readonly alternative: string;
	readonly definition: string;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function sync() {

	const url = await secret(DataURL);

	// !!! service injection
	// !!! fetcher
	// !!! caching

	const concepts = await pipe(
		(items(url))
		(map(fetch))
		(flatMap(r =>

			// ;(cast) @types/node types the fetch body against undici, which omits the async iteration
			// members web streams natively support

			(r.body ?? undefined) as undefined | ReadableStream<Uint8Array>

		))
		(csv<Concept>(CSVFormat))
		(take(3))
		(forEach(console.log))
	);

}
