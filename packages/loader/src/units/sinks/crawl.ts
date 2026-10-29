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

import type { University } from "@ec2u/data-shared/universities/index.core.js";
import type { Markdown } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { pipe, type Sink } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { filter, flat, fork, map, tee } from "@metreeca/flow/tasks";
import { focus, html, untag } from "@metreeca/mime-xml";
import { settle, type Tally } from "@metreeca/pipe-store";
import { fetch } from "@metreeca/pipe-url";
import { digest } from "@metreeca/work/core/digest.js";
import { denoise } from "@metreeca/work/mime-xml/denoise.js";
import { extract } from "../tasks/extract.js";
import { complete, retract, stated } from "./sync.js";


const retrieval = 10; // the number of pages fetched at the same time from the source site // !!! as option
const analysis = 10; // the number of pages analysed at the same time by the model // !!! as option


/**
 * The main content of a unit page, along with the address the scan listed it under.
 *
 * The address names the unit the page describes, so it travels with the content rather than being read back from it:
 * what a page says about its own address is data, not identity, and redirects never rename the unit.
 */
export type Page = {

	readonly url: string
	readonly document: Markdown

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a sink keeping the units a university describes one per web page in line with a crawl of those pages.
 *
 * The scan is the feed of page addresses, each naming the unit its page describes. Every page is read for its main
 * content, cleared of the noise that changes on every request, and a page whose content digest matches the one recorded
 * with the unit the store already holds is skipped before extraction, so an unchanged page costs a fetch and no model
 * call; under `force` every page is extracted and stated afresh. The unit of each remaining
 * page is extracted from its content, then completed and stated as {@link complete} describes, one at a time, so a run
 * cut short keeps what it has stated and the next one carries on from there, with nothing to reconcile in between.
 *
 * A page that fails to be read is skipped and left to the next run, while it stays in the scan, so the unit the store
 * holds for it is kept rather than retracted on the strength of a fetch failure. The units the store holds for the
 * university and the scan never named are retracted as {@link retract} describes, once the scan has been drawn whole.
 *
 * @param university The university the units are attributed to
 *
 * @param options The options governing how pages are stated
 * @param options.force Whether every page is extracted afresh, ignoring the digests of stored units, as needed after a
 * change to the extraction prompt that unchanged pages would otherwise never pick up; defaults to `false`
 *
 * @returns A sink drawing a feed of unit page addresses and resolving to a tally of what it did
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if the run would leave in place less than three
 * quarters of the stored units, or if the store rejects a unit as invalid, with the units already stated kept
 */
export function crawl(university: University, {

	force = false

}: {

	readonly force?: boolean

} = {}): Sink<string, Tally> {

	return urls => pipe(
		(items(urls))
		(tee(
			urls => {

				const digests = force ? new Set<string>() : stated(university);

				return pipe(
					(items(urls))
					(fork(retrieval, urls => pipe(
						(items(urls))
						(flat(map(read)))
					)))
					(filter(async ({ document }) => !(await digests).has(digest(document))))
					(fork(analysis, pages => pipe(
						(items(pages))
						(extract(university))
					)))
					(complete(university))
				);

			},
			urls => pipe(
				(items(urls))
				(retract(university))
			)
		))
		(settle())
	);


	function read(url: string) {
		return pipe(
			(items([url]))
			(fetch())
			(html())
			(denoise())
			(focus())
			(untag())
			(map((document): Page => immutable({ url, document })))
		);
	}

}
