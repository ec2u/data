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
import { linz } from "@/universities/index.core.js";
import { immutable } from "@metreeca/core/structures";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { fork } from "@metreeca/flow/tasks";
import { crawl, fetch } from "@metreeca/gear-url";
import { html, link, xpath } from "@metreeca/gear-xml";


const concurrency = 10; // the number of index pages read at the same time from the source site

const Publisher = immutable({

	id: "https://www.jku.at/news-events/events/",

	dataset: organizations.id,
	university: linz.id,

	label: "University of Linz / News & Events",
	prefLabel: "University of Linz / News & Events"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	execute(LinzUniversity);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function LinzUniversity() {

	return pipe(
		(items(Publisher.id))
		(crawl(

			fork(concurrency, urls => pipe(
				items(urls)
				(fetch())
				(html())
				(xpath())
			)),

			path => path("//*[contains(@class,'f3-widget-paginator')]/li/a/@href").map(link),
			path => path("//*[contains(@class,'news_list_item')]/a/@href").map(link)

		))
		(sync(Publisher))
	);

}
