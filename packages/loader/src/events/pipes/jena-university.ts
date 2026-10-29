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

import { Publisher } from "@ec2u/data-shared/events/index.js";
import { sync } from "../sinks/sync.js";
import { execute } from "../../index.core.js";
import { organizations } from "@ec2u/data-shared/organizations/index.js";
import { jena } from "@ec2u/data-shared/universities/index.core.js";
import { immutable } from "@metreeca/core/values";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { fork, map } from "@metreeca/flow/tasks";
import { crawl, fetch } from "@metreeca/pipe-url";
import { html, link, string, xpath } from "@metreeca/mime-xml";


const concurrency = 10; // the number of index pages read at the same time from the source site


// the calendars are published one per language, as matching the localised descriptions of the same event across the
// two was found too brittle to be worth it: each calendar states events of its own

const Publishers: readonly Publisher[] = immutable([

	{
		id: "https://www.uni-jena.de/16965/kommende-veranstaltungen",
		label: "Jena University / Events (German)"
	},
	{
		id: "https://www.uni-jena.de/en/16965/events",
		label: "Jena University / Events (English)"
	},

	{
		id: "https://www.uni-jena.de/17425/veranstaltungskalender",
		label: "Jena University / International / Events (German)"
	},
	{
		id: "https://www.uni-jena.de/en/17425/upcoming-events",
		label: "Jena University / International / Events (English)"
	},

	{
		id: "https://www.uni-jena.de/81092/kalender-studium-international",
		label: "Jena University / Calendar Studies international / Events (German)"
	},
	{
		id: "https://www.uni-jena.de/en/81092/calendar-studium-international",
		label: "Jena University / Calendar Studies international / Events (English)"
	},

	{
		id: "https://www.uni-jena.de/120659/ec2u-veranstaltungen",
		label: "Jena University / EC2U / Events (German)"
	},
	{
		id: "https://www.uni-jena.de/en/120659/ec2u-veranstaltungen",
		label: "Jena University / EC2U / Events (English)"
	},

	{
		id: "https://www.uni-jena.de/17210/veranstaltungen",
		label: "Jena University / Academic Career / Events (German)"
	},
	{
		id: "https://www.uni-jena.de/en/17210/events",
		label: "Jena University / Academic Career / Events (English)"
	}

].map(({ id, label }) => ({

	id,

	dataset: organizations.id,
	university: jena.id,

	label,
	prefLabel: label

})));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	execute(JenaUniversity);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function JenaUniversity() {

	return Promise.all(Publishers.map(publisher => pipe(
		(items(publisher.id))
		(crawl(
			fork(concurrency, urls => pipe(
				items(urls)
				(fetch())
				(html())
				(xpath())
			)),
			path => pipe( // the calendar paginates through a form button per page
				items(path("//div[@class='pagination']/button[@name='page' and not(@disabled)]/@value"))
				(map(string))
				(map(page => `${publisher.id}?page=${page}&block=body-0`))
			),
			path => pipe(
				items(path("//ol/li/article/a/@href"))
				(map(link))
			)
		))
		(sync({ publisher }))
	)));

}
