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

import { sync } from "../sinks/sync.js";
import { execute } from "../../index.core.js";
import { organizations } from "@ec2u/data-shared/organizations/index.js";
import { salamanca } from "@ec2u/data-shared/universities/index.core.js";
import { isString } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { filter, fork, map } from "@metreeca/flow/tasks";
import { crawl, fetch } from "@metreeca/pipe-url";
import { html, link, string, xpath } from "@metreeca/mime-xml";


const concurrency = 10; // the number of index pages read at the same time from the source site

// the search page assembles its results from this endpoint, which answers a page of event cards to a form post; the
// page is stated as the last step of the path and a blank keyword matches every event

const Search = "https://eventum.usal.es/search/basic_search_ajax";

const PagePattern = /#(\d+)$/;

const Publisher = immutable({

	id: "https://eventum.usal.es/",

	dataset: organizations.id,
	university: salamanca.id,

	label: "University of Salamanca / Eventum",
	prefLabel: "University of Salamanca / Eventum"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	execute(SalamancaUniversity);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function SalamancaUniversity() {

	return pipe(
		(items(`${Search}/1`))
		(crawl(
			fork(concurrency, urls => pipe(
				items(urls)
				(map(url => new Request(url, {

					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: "keyword="

				})))
				(fetch())
				(html())
				(xpath())
			)),
			path => pipe( // the pager states pages as fragments, rather than as addresses of their own
				items(path("//ul[@class='pagination']/li/a/@href"))
				(map(string))
				(map(href => PagePattern.exec(href)?.[1])) // the next and previous links state no page of their own
				(filter(isString))
				(map(page => `${Search}/${page}`))
			),
			path => pipe( // a card links its event from its image too, so only the title link is followed
				items(path("//p[@class='main']/a/@href"))
				(map(link))
			)
		))
		(sync(Publisher))
	);

}
