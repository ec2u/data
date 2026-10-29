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
import { opt, type Optional, type Value } from "@metreeca/core";
import { resolve } from "@metreeca/core/resource";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { distinct, flat, fork, map } from "@metreeca/flow/tasks";
import { html, link, unwrap, xpath } from "@metreeca/mime-xml";
import { fetch } from "@metreeca/pipe-url";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { type ProgramDraft, sync } from "../sinks/sync.js";
import { program } from "./jena.core.js";


const Source = resolve(base, "/offerings/jena");

const CatalogueURL = "https://www.uni-jena.de/en/study-programme";

const retrieval = 10; // the number of pages fetched at the same time from the source site // !!! as option


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Jena);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the degree programs listed by the Jena study programme catalogue.
 *
 * Reads the program pages the catalogue links from its filterable list, then the `AboutPage` structured data each page
 * embeds as JSON-LD, as {@link program} describes. A listed page that fails to load is logged and states no program,
 * leaving the retraction floor to keep the programs of failed pages from being retracted wholesale; a page embedding no
 * usable structured data is logged and dropped, its program being retracted as no longer described.
 *
 * @returns A promise resolving to a tally of what the run did
 */
export async function Jena() {
	return pipe(
		(items([CatalogueURL]))
		(fetch())
		(html())
		(xpath())
		(flat(map(path => path("//li[@data-filter]/a/@href").map(link))))
		(distinct())
		(fork(retrieval, urls => pipe(
			(items(urls))
			(flat(map(async url => opt(await embedded(url), values => read(values, url)) ?? [])))
		)))
		(sync(Source))
	);
}


function read(values: readonly Value[], url: string): readonly ProgramDraft[] {

	const draft = program(values, url);

	if ( draft === undefined ) {

		logger.warning`no structured data at <${url}>`;

		return [];

	} else {

		return [draft];

	}

}


/**
 * Reads the JSON-LD values a page embeds, or nothing if the page fails to load.
 */
async function embedded(url: string): Promise<Optional<readonly Value[]>> {

	const lists = await pipe(
		(items([url]))
		(fetch())
		(html())
		(unwrap())
		(toArray())
	);

	return lists.length === 0 ? undefined : lists.flat();

}
