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
import { iasi } from "@/universities/index.core.js";
import { immutable } from "@metreeca/core/structures";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { fork, map } from "@metreeca/flow/tasks";
import { crawl, fetch } from "@metreeca/gear-url";
import { html, link, xpath } from "@metreeca/gear-xml";


const concurrency = 10; // the number of index pages read at the same time from the source site

const Publisher = immutable({

	id: "https://360.uaic.ro/blog/category/evenimente/",

	dataset: organizations.id,
	university: iasi.id,

	label: "University of Iasi / 360 Events",
	prefLabel: "University of Iasi / 360 Events"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	execute(IasiUniversity360);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function IasiUniversity360() {

	return pipe(
		(items(Publisher.id))
		(crawl(
			fork(concurrency, urls => pipe(
				items(urls)
				(fetch())
				(html())
				(xpath())
			)),
			path => pipe(
				items(path("//div[@class='archive-pagination']/a[contains(@class,'page-numbers')]/@href"))
				(map(link))
			),
			path => pipe(
				items(path("//article[contains(@class, 'category-evenimente')]/h2[@class='entry-title']/a[@rel='bookmark']/@href"))
				(map(link))
			)
		))
		(sync(Publisher))
	);

}
