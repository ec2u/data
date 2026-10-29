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

import { pavia } from "@ec2u/data-shared/universities/index.core.js";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { distinct, filter, flat, map } from "@metreeca/flow/tasks";
import { html, link, xpath } from "@metreeca/mime-xml";
import { fetch } from "@metreeca/pipe-url";
import { execute } from "../../index.core.js";
import { crawl } from "../sinks/crawl.js";


/**
 * The catalogue pages listing Pavia units, each a list of links to the homepages of the units it catalogues.
 */
const Catalogues = [
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti",
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-servizio-dateneo",
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-ricerca-interdipartimentali"
];

/**
 * The links of the catalogue lists, leaving out the page furniture and the regulation links around them.
 */
const UnitLinks = "//div[contains(@class,'field--name-field-testo-paragrafo')]//li/a/@href";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Pavia);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function Pavia() {

	return pipe(
		(items(Catalogues))
		(fetch())
		(html())
		(xpath())
		(flat(map(path => pipe(
			(items(path(UnitLinks)))
			(map(link))
		))))
		(filter(url => /^https?:/.test(url) && !/\.pdf$/i.test(new URL(url).pathname)))
		(map(url => url.replace(/#.*$/, "")))
		(distinct())
		(crawl(pavia))
	);

}
