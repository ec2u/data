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

import { sync } from "@/events/sinks/sync.js";
import { execute } from "@/index.core.js";
import { organizations } from "@/organizations/index.js";
import { poitiers } from "@/universities/index.core.js";
import { immutable } from "@metreeca/core/values";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { fork, map } from "@metreeca/flow/tasks";
import { crawl, fetch } from "@metreeca/gear-url";
import { html, link, xpath } from "@metreeca/gear-xml";


const concurrency = 10; // the number of index pages read at the same time from the source site

// the events are listed by a search page of their own, while the publisher is the news and events section as a whole

const Search = "https://www.univ-poitiers.fr/searchevents/";

const Publisher = immutable({

	id: "https://www.univ-poitiers.fr/c/actualites/",

	dataset: organizations.id,
	university: poitiers.id,

	label: "University of Poitiers / News and Events",
	prefLabel: "University of Poitiers / News and Events"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	execute(PoitiersUniversity);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function PoitiersUniversity() {

	return pipe(
		(items(Search))
		(crawl(
			fork(concurrency, urls => pipe(
				items(urls)
				(fetch())
				(html())
				(xpath())
			)),
			path => pipe(
				items(path("//div[@class='wp-pagenavi']//a/@href"))
				(map(link))
			),
			path => pipe(
				items(path("//li[@class='post']/a/@href"))
				(map(link))
			)
		))
		(sync(Publisher))
	);

}
