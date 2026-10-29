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

import { base } from "@ec2u/data-shared";
import { umea } from "@ec2u/data-shared/universities/index.core.js";
import { isArray, isObject, isString } from "@metreeca/core";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import { type Feed, pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";
import { fetch } from "@metreeca/pipe-url";
import { execute } from "../../index.core.js";
import { crawl, type Lead } from "../sinks/crawl.js";
import type { Draft } from "../sinks/sync.js";


const Source = resolve(base, "/offerings/umea");

const DataURL = "offerings-umea-url";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Umea);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the programs and courses listed by the Umeå study catalogue.
 *
 * Asks the search API behind the catalogue for every program and every course page it lists, then crawls the pages,
 * extracting each offering by model. A listing that fails to load yields no leads, so the run retracts nothing on the
 * strength of it and fails on the retraction floor instead, leaving the stored offerings in place.
 *
 * @returns A promise resolving to a tally of what the run did
 */
export async function Umea() {

	const url = await service(createVault)(DataURL);

	return pipe(
		(flat(items([
			listing(url, "program", "program"),
			listing(url, "kurs", "course")
		])))
		(crawl(Source))
	);

}


/**
 * Lists the pages the search API advertises under a content label.
 */
function listing(url: string, label: string, kind: Draft["kind"]): Feed<Lead> {
	return pipe(
		(items([new Request(url, {

			method: "POST",

			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json"
			},

			body: JSON.stringify({
				Query: "",
				Skip: "0",
				Take: "10000",
				QueryPrefix: "hepp",
				Filters: [
					{ Type: 2, Value: "1305560umucms,1305559umucms" },
					{ Type: 5, Name: "contentlabel", Value: label }
				]
			})

		})]))
		(fetch())
		(flat(map(async response => leads(await response.json(), kind))))
	);
}


/**
 * Reads the leads a search API response lists.
 *
 * Every hit with a web address names one offering of `kind`, keyed by its page address and seeded with nothing else.
 *
 * @param response The search API response as parsed JSON
 * @param kind The kind of offering the response lists
 *
 * @returns The leads the response lists, in order of first mention
 */
export function leads(response: unknown, kind: Draft["kind"]): readonly Lead[] {

	const urls = isObject(response) && isArray(response.hits) ? response.hits
		.map(hit => isObject(hit) && isString(hit.url) ? hit.url.trim() : "")
		.filter(url => URL.canParse(url) && /^https?:$/.test(new URL(url).protocol)) : [];

	return [...new Set(urls)].map(url => immutable({ url, seed: seed(kind, url) }));

}


/**
 * Seeds an offering keyed by its page address, leaving every other fact to the page.
 */
function seed(kind: Draft["kind"], key: string): Draft {
	return kind === "program"
		? immutable({ kind: "program", university: umea, key, name: {} })
		: immutable({ kind: "course", university: umea, key, name: {} });
}
