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

import { extractGoogle } from "@/events/tasks/extract-google.js";
import { extractOpenAI } from "@/events/tasks/extract-openai.js";
import { execute } from "@/index.core.js";
import type { Value } from "@metreeca/core";
import type { Text } from "@metreeca/core/strings";
import { pipe, type Task } from "@metreeca/flow";
import { items, range } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { flat, fork, map, take } from "@metreeca/flow/tasks";
import { jpath, json, number, string } from "@metreeca/gear-json";
import { crawl, fetch } from "@metreeca/gear-url";
import { report } from "@metreeca/tape";
import { focus, html, untag } from "@metreeca/gear-xml";
import { writeFile } from "node:fs/promises";


const Search = "https://content.fw.uc.pt/v1/agenda/events/search";
const Events = "https://agenda.coimbra.pt/event";

const Items = 10;


await execute(async () => {

	const pages = await pipe(
		(items(Search))
		(crawl(
			fork(10, urls => pipe(
				items(urls)
				(fetch())
				(json())
				(jpath())
			)),
			path => pipe(
				items(path("pagination.total_pages"))
				(map(number))
				(flat(map(total => range(2, total+1))))
				(map(index => `${Search}?page=${index}`))
			),
			path => pipe(
				items(path("events.*.key"))
				(map(string))
				(map(key => `${Events}/${key}`))
			)
		))
		(take(Items))
		(fetch())
		(html())
		(focus())
		(untag())
		(toArray())
	);

	const google = extractGoogle();
	const openai = extractOpenAI();

	const results = await Promise.all(pages.map(async page => ({

		page,

		google: await attempt(google, page),
		openai: await attempt(openai, page)

	})));

	await writeFile(
		"/private/tmp/claude-501/-Users-Alessandro-Metreeca-Projects-EC2U-Pipe/1e7852ec-90a6-4fbe-8a06-e7274d7a0ede/scratchpad/compare.json",
		JSON.stringify(results, null, "\t")
	);

	console.log(`pages ${pages.length}`);

});


async function attempt(task: Task<Text, Value>, page: Text) {
	try {

		return { payload: (await pipe(items([page])(task)(toArray())))[0] ?? null };

	} catch ( e ) {

		return { error: report(e) };

	}
}
