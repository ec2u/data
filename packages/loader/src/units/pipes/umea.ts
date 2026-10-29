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

import { umea } from "@ec2u/data-shared/universities/index.core.js";
import { immutable } from "@metreeca/core/values";
import { type Feed, pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { distinct, filter, flat, map } from "@metreeca/flow/tasks";
import { html, link, xpath } from "@metreeca/mime-xml";
import { fetch } from "@metreeca/pipe-url";
import { execute } from "../../index.core.js";
import { crawl } from "../sinks/crawl.js";


/**
 * The index pages listing Umeå units, each with the XPath selectors leading from it to the unit pages, one hop each.
 */
const Indexes = immutable([

	{
		url: "https://www.umu.se/om-umea-universitet/sa-ar-vi-organiserade/hela-organisationen/",
		hops: ["//section[contains(@class,'maincontent')]//a/@href"]
	},

	{
		url: "https://www.umu.se/om-umea-universitet/sa-ar-vi-organiserade/institutioner-och-enheter/",
		hops: ["//section[contains(@class,'maincontent')]//a/@href"]
	},

	{
		url: "https://www.umu.se/om-umea-universitet/sa-ar-vi-organiserade/fakulteter-och-hogskolor/",
		hops: ["//section[contains(@class,'maincontent')]//ul//a/@href"]
	},

	{
		url: "https://www.umu.se/om-umea-universitet/sa-ar-vi-organiserade/centrum/",
		hops: ["//section[contains(@class,'maincontent')]//p/a/@href"]
	},

	{
		url: "https://www.umu.se/forskning/forskningsgrupper/",
		hops: ["//div[@class='navpuff cell']/a/@href", "//div[@class='item']/a/@href"]
	},

	{
		url: "https://www.umu.se/forskning/forskningsinfrastruktur/",
		hops: ["//a[contains(@href,'/forskning/infrastruktur/')]/@href"]
	}

]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Umea);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function Umea() {

	return pipe(
		(items(Indexes))
		(flat(map(({ url, hops }) => hops.reduce(follow, items([url])))))
		(filter(url => /^https?:/.test(url)))
		(map(url => url.replace(/#.*$/, "")))
		(distinct())
		(crawl(umea))
	);

}


/**
 * Follows one hop from a feed of pages to the pages they link to through `selector`, resolved against each page; a page
 * that fails to be read links nowhere, so the next hop starts from the pages that could be read.
 */
function follow(pages: Feed<string>, selector: string): Feed<string> {
	return pipe(
		(items(pages))
		(fetch())
		(html())
		(xpath())
		(flat(map(path => pipe(
			(items(path(selector)))
			(map(link))
		))))
	);
}
