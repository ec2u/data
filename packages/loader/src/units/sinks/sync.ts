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

import { CommentLength, LabelLength } from "@ec2u/data-shared";
import { getOrganizationId } from "@ec2u/data-shared/organizations/index.js";
import { Page, pages as directory, Pages } from "@ec2u/data-shared/pages/index.js";
import { Unit, units, Units } from "@ec2u/data-shared/units/index.js";
import type { University } from "@ec2u/data-shared/universities/index.core.js";
import { isString, opt, type URLLike } from "@metreeca/core";
import { clip, type Markdown } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toSet } from "@metreeca/flow/sinks";
import { distinct, filter, flat, fork, map, tee, trim } from "@metreeca/flow/tasks";
import { focus, html, untag } from "@metreeca/mime-xml";
import { validate } from "@metreeca/mime-jsonld";
import { delta, type Delta, lookup, retire, settle, type Tally } from "@metreeca/pipe-store";
import { fetch } from "@metreeca/pipe-url";
import { digest } from "@metreeca/work/core/digest.js";
import { analyze, type Analysed } from "../tasks/analyze.js";
import type { Listed } from "../tasks/list.js";


const retrieval = 10; // the number of pages fetched at the same time from the source site // !!! as option
const analysis = 10; // the number of units analysed at the same time by the model // !!! as option

const survival = 0.75; // the smallest fraction of the stored units a single run must leave in place // !!! as option


/**
 * A listed unit along with its identifier and the page it is profiled from, as read when the run reached it.
 */
export type Entry = {

	readonly id: string

	readonly page: string
	readonly digest: string

	readonly listed: Listed

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a sink keeping the units of a university in line with its directory pages.
 *
 * Every unit listed is profiled from its website, or from the directory page listing it where it has none, and stated
 * as it is drawn, each in a store operation of its own, so a run cut short keeps what it has stated and the next one
 * carries on from there. A unit the store already holds is profiled again only once its page changes, unless `force`
 * is set; a unit the model fails on records no digest and is profiled again on the next run, leaving the copy the
 * store holds, if any, exactly as it was, so a model failure never withdraws a unit already published.
 *
 * Units are named by the university and the website the directory lists them with, falling back to their name where
 * they have none, so units stated under the same key by other sources of the university are one and the same resource.
 *
 * The units the store holds for the university and the feed never named are retracted once it has been drawn whole,
 * along with the page records left without a unit, so nothing is retired on the strength of a partial listing. A feed
 * naming fewer than three quarters of the stored units retracts nothing and fails, so a truncated or unreachable
 * directory costs a single run rather than the units of the university the store already holds.
 *
 * @param options The options governing how units are stated
 * @param options.university The university the units belong to
 * @param options.source The address the directory pages are recorded as listed by
 * @param options.force Whether every unit is profiled afresh, ignoring the digests of stored pages; defaults to `false`
 *
 * @returns A sink drawing a feed of listed units and resolving to a tally of what it did
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if the run would leave in place less than three
 * quarters of the stored units of the university, with nothing retracted and the units already stated kept
 */
export function sync({

	university,
	source,

	force = false

}: {

	readonly university: University
	readonly source: string

	readonly force?: boolean

}): Sink<Listed, Tally> {

	return listed => pipe(
		(items(listed))
		(tee(
			insert(),
			remove()
		))
		(settle())
	);


	function insert(): Task<Listed, Delta> {

		return listed => {

			const digests = force ? new Set<string>() : pipe(
				(lookup({

					entry: directory.id,
					shape: Pages,

					model: { resources: { digest: {}, "?source": [source] } } // !!! DSL

				}))
				(map(page => page.digest))
				(toSet())
			);

			const stored = force ? new Set<string>() : pipe(
				(lookup({

					entry: units.id,
					shape: Units,

					model: { resources: { id: {}, "?university": [university.id] } } // !!! DSL

				}))
				(map(unit => unit.id))
				(toSet())
			);


			async function modified({ id, digest }: Entry) {
				return !(await stored).has(id) || !(await digests).has(digest);
			}


			return pipe(listed
				(fork(retrieval, listed => pipe(
					(items(listed))
					(flat(map(listed => pipe(
						(items([page(listed)]))
						(read())
						(map((document): Entry => immutable({
							id: identify(listed),
							page: page(listed),
							digest: digest(document),
							listed
						})))
					))))
					(filter(modified))
				)))
				(fork(analysis, entries => pipe(
					(items(entries))
					(analyze())
				)))
				(tee(
					record(),
					define()
				))
			);

		};


		function record(): Task<Analysed, Delta> { // every page states its digest, so the unit won't be profiled again

			return analysed => pipe(
				(items(analysed))
				(map(({ page, digest }): Delta =>
					delta(page, Page, immutable({
						id: page,
						label: clip(page, LabelLength),
						dataset: directory.id,
						source,
						digest
					}))
				))
			);

		}

		function define(): Task<Analysed, Delta> {

			return analysed => pipe(
				(items(analysed))
				(map(complete))
				(validate(Unit))
				(map(unit => delta(unit.id, Unit, unit)))
			);


			function complete({

				id,

				listed: { website },

				analysis: {
					formal,
					short,
					acronym,
					identifier,
					email,
					summary,
					description,
					keywords
				}

			}: Analysed) {

				return immutable({

					id,

					dataset: units.id,
					university: university.id,

					generated: true,

					label: clip(formal, LabelLength),
					comment: { en: clip(summary, CommentLength) },

					prefLabel: { en: formal },
					altLabel: acronym ?? short,

					identifier,

					email: [email].filter(isString),
					homepage: [website].filter(isString),

					description: { en: description },
					keyword: keywords,

					unitOf: [university.id]

				});

			}

		}

	}

	function remove(): Task<Listed, Delta> {

		return listed => pipe(
			(items(listed))
			(tee(
				retireUnits(),
				retirePages()
			))
		);


		function retireUnits(): Task<Listed, Delta> {

			return listed => {

				const existing = pipe(
					(lookup({

						entry: units.id,
						shape: Units,

						model: { resources: { id: {}, "?university": [university.id] } } // !!! DSL

					}))
					(map(unit => unit.id))
				);

				return pipe(
					(items(listed))
					(map(identify))
					(distinct())
					(retire({ survival, existing }))
					(map(id => delta(id, Unit, null)))
				);

			};

		}

		function retirePages(): Task<Listed, Delta> {

			return listed => {

				const existing = pipe(
					(lookup({

						entry: directory.id,
						shape: Pages,

						model: { resources: { id: {}, "?source": [source] } } // !!! DSL

					}))
					(map(page => page.id))
				);

				return pipe(
					(items(listed))
					(map(page))
					(distinct())
					(retire({ survival, existing }))
					(map(id => delta(id, Page, null)))
				);

			};

		}

	}


	/**
	 * Names a unit from what the directory listed: both branches call it, so the units `insert` states are exactly the
	 * ones `remove` weighs against the scan, with no store lookup needed to reconcile the two.
	 */
	function identify({ website, formal }: Listed): string {
		return getOrganizationId(university.id, website ?? formal);
	}

}


/**
 * Locates the page a listed unit is profiled from: its website, or the directory page listing it where it has none.
 */
function page({ website, profile }: Listed): string {
	return website ?? profile;
}

/**
 * Reads pages into markdown documents of their main content; a page that fails to be read is skipped.
 */
function read(): Task<URLLike, Markdown> {
	return urls => pipe(
		(items(urls))
		(fetch())
		(html())
		(trim(map(tree => opt(focus(tree), untag))))
	);
}
