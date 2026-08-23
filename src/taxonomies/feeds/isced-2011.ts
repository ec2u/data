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

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { secret } from "@/_/gcp/secrets.js";
import { csv } from "@/_/flow/formats/csv/index.js";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/structures";
import { pipe, type Task } from "@metreeca/pipe";
import { items } from "@metreeca/pipe/feeds";
import { forEach, toArray } from "@metreeca/pipe/sinks";
import { take } from "@metreeca/pipe/tasks";
import { log } from "@metreeca/tape";
import { createFetch, type Fetch, type Middleware } from "@metreeca/core/fetch";
import { createThrottle } from "@metreeca/core/async";


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

	await pipe(
		(items(url))
		(http())
		(csv<Concept>(CSVFormat))
		(take(3))
		(forEach(console.log))
	);

}


//// !!! ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const URLLengthLimit = 80;

const logger = log(import.meta.url);

/**
 * Creates a resource retrieval task.
 *
 * The generated task reads a stream of requests as a stream of byte chunks, reporting the body of each response as its
 * chunks are received; requests are given as accepted by `fetch()`, that is as URL strings, {@link URL} objects or
 * {@link Request} objects.
 *
 * Chunks are pulled from the response as they are asked for, so resources of any size are handled without holding them
 * in memory and a consumer that stops early cancels the response; a response reporting no body is read as an empty
 * stream.
 *
 * > [!WARNING]
 * > Requests stating a URL that is not absolute or is otherwise malformed, and responses reporting an unsuccessful
 * > status, are skipped and reported to the log, leaving the stream to run to completion.
 *
 * @param middlewares The middlewares to be layered over the standard `fetch` function, in request processing order
 *
 * @returns A task converting a stream of requests into a stream of response byte chunks
 *
 * @throws Error While iterating the returned stream, whatever the retrieval reports while connecting to a resource or
 *               receiving its response
 */
function http(... middlewares: readonly Middleware[]): Task<string | URL | Request, Uint8Array> {

	return async function* (requests) {

		const fetcher = createFetch(...middlewares, () => fetch); // !!! via service locator

		for await ( const request of requests ) {

			const { method, url } = request instanceof Request ? request : { method: "GET", url: request.toString() };

			const s = clip(url, URLLengthLimit);

			if ( !URL.canParse(url) ) {

				logger.warn`${method} ${s} >> malformed resource URL`;

			} else {

				logger.info`${method} ${s}`;

				const response = await fetcher(request);

				if ( response.ok ) {

					yield* response.body ?? []; // a response reporting no body is read as an empty stream

				} else {

					logger.warn`${method} ${s} >> ${response.status} ${response.statusText}`;

				}

			}

		}

	};

}
