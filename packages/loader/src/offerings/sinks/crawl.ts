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

import { getAcademicYear } from "@ec2u/data-shared/offerings/index.js";
import type { Markdown } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { pipe, type Sink } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { filter, flat, fork, map, tee, trim } from "@metreeca/flow/tasks";
import { focus, html, untag } from "@metreeca/mime-xml";
import { settle, type Tally } from "@metreeca/pipe-store";
import { fetch } from "@metreeca/pipe-url";
import type { Reference } from "@metreeca/qest/state";
import { log } from "@metreeca/tape";
import { digest } from "@metreeca/work/core/digest.js";
import { denoise } from "@metreeca/work/mime-xml/denoise.js";
import { extract } from "../tasks/extract.js";
import { complete, date, type Draft, identify, retract, stated } from "./sync.js";


const retrieval = 10; // the number of pages fetched at the same time from the source site // !!! as option
const analysis = 10; // the number of pages analysed at the same time by the model // !!! as option


const logger = log(import.meta.url);


/**
 * An offering page listed by a source, along with what the listing itself states about the offering.
 *
 * The seed names the offering, keyed by what the listing calls it, usually the page address, and states the facts the
 * listing gives; the page supplies the rest. A fact the seed states is never overridden by what is read from the page.
 */
export type Lead = {

	readonly url: string
	readonly seed: Draft

}

/**
 * The main content of an offering page, along with the lead listing it and the digest it is recorded with.
 */
export type Page = {

	readonly lead: Lead
	readonly document: Markdown
	readonly hash: string

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a sink keeping the offerings a source describes one per web page in line with a crawl of those pages.
 *
 * The scan is the feed of leads, each naming the offering its page describes. Leads are dated as the sync sink dates
 * drafts, so a page stating no academic year names an offering in the year current at retrieval. Every page is read
 * for its main content, cleared of the noise that changes on every request, and a page whose content, along with its
 * seed, matches the digest recorded with the offering the store holds is skipped before extraction, so an unchanged
 * page costs a fetch and no model call; under `force` every page is extracted and stated afresh. The offering of each
 * remaining page is extracted from its content over its seed, then completed and stated as the sync sink does, one at
 * a time, so a run cut short keeps what it has stated and the next one carries on from there.
 *
 * A page that fails to be read is skipped and left to the next run, while it stays in the scan, so the offering the
 * store holds for it is kept rather than retracted on the strength of a fetch failure. The offerings the store holds
 * for the source and the scan never named are retracted once the scan has been drawn whole, behind the same floor.
 *
 * @param source The identifier of the source listing the offerings
 *
 * @param options The options governing how pages are stated
 * @param options.force Whether every page is extracted afresh, ignoring stored digests, as needed after a change to
 * the extraction prompt that unchanged pages would otherwise never pick up; defaults to `false`
 *
 * @returns A sink drawing a feed of offering leads and resolving to a tally of what it did
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if the run would leave in place less than three
 * quarters of the stored offerings, or if the store rejects an offering as invalid, with the offerings the run stated
 * before the failure kept in the store exactly as they were written, each committed on its own
 */
export function crawl(source: Reference, {

	force = false

}: {

	readonly force?: boolean

} = {}): Sink<Lead, Tally> {

	const year = getAcademicYear(new Date()); // taken once, so a run straddling the rollover dates all leads alike

	return leads => pipe(
		(items(leads))
		(map(lead => immutable({ ...lead, seed: date(lead.seed, year) })))
		(filter(identified))
		(tee(
			leads => {

				const digests = force ? new Set<string>() : stated(source);

				return pipe(
					(items(leads))
					(fork(retrieval, leads => pipe(
						(items(leads))
						(flat(map(read)))
					)))
					(filter(async ({ hash }) => !(await digests).has(hash)))
					(fork(analysis, pages => pipe(
						(items(pages))
						(extract())
					)))
					(complete(source))
				);

			},
			leads => pipe(
				(items(leads))
				(map(({ seed }) => identify(seed)))
				(trim())
				(retract(source))
			)
		))
		(settle())
	);


	function identified({ url, seed }: Lead): boolean {

		if ( identify(seed) === undefined ) {

			logger.warning`unidentified ${seed.kind} <${seed.key}> listed at <${url}>`;

			return false;

		} else {

			return true;

		}

	}

	function read(lead: Lead) {
		return pipe(
			(items([lead.url]))
			(fetch())
			(html())
			(denoise())
			(focus())
			(untag())
			(map((document): Page => immutable({ lead, document, hash: fingerprint(lead.seed, document) })))
		);
	}

}

/**
 * Computes the digest an offering page is recorded with.
 *
 * The digest covers the page content along with the seed, so that a change to what the listing states about the
 * offering, its academic year included, restates it as surely as a change to the page itself.
 *
 * @param seed The seed of the lead listing the page
 * @param document The main content of the page
 *
 * @returns The digest of `document` and `seed`
 */
export function fingerprint(seed: Draft, document: Markdown): string {
	return digest({ seed, document });
}
