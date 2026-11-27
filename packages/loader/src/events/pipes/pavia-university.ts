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

import { pavia } from "@ec2u/data-shared/index.core.js";
import { organizations } from "@ec2u/data-shared/organizations/index.js";
import { immutable } from "@grafctory/core/values";
import { pipe } from "@grafctory/flow";
import { items } from "@grafctory/flow/feeds";
import { fork, map } from "@grafctory/flow/tasks";
import { html, link, xpath } from "@grafctory/mime-xml";
import { crawl, fetch } from "@grafctory/data-url";
import { execute } from "../../index.core.js";
import { sync } from "../sinks/sync.js";


const Pipeline = "/events/pavia-university";

const concurrency = 10; // the number of index pages read at the same time from the source site

const Publisher = immutable({

	id: "https://www.unipv.news/eventi",

	dataset: organizations.id,
	university: pavia.id,

	label: "University of Pavia / Events",
	prefLabel: "University of Pavia / Events"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	execute(PaviaUniversity);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function PaviaUniversity() {

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
				items(path("//a[contains(concat(' ', normalize-space(@class), ' '), ' page-link ')]/@href"))
				(map(link))
			),
			path => pipe(
				items(path("//*[contains(concat(' ', normalize-space(@class), ' '), ' eventi-card ')]//a/@href"))
				(map(link))
			)
		))
		(sync({
			pipeline: Pipeline,
			publisher: Publisher
		}))
	);

}
