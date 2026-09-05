import { extract } from "@/events/tasks/extract.js";
import { execute } from "@/index.core.js";
import type { Value } from "@metreeca/core";
import { pipe } from "@metreeca/flow";
import { items, range } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { flat, fork, map, take } from "@metreeca/flow/tasks";
import { jpath, json, number, string } from "@metreeca/gear-json";
import { crawl, fetch } from "@metreeca/gear-url";
import { focus, html, untag } from "@metreeca/gear-xml";


const Search = "https://content.fw.uc.pt/v1/agenda/events/search";
const Events = "https://agenda.coimbra.pt/event";


await execute(async () => {

	const pages = await pipe(
		(items(Search))
		(crawl(
			fork(10, urls => pipe(items(urls)(fetch())(json())(jpath()))),
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
		(take(10))
		(fetch())
		(html())
		(focus())
		(untag())
		(toArray())
	);

	const payloads = await pipe(items(pages)(extract())(toArray())) as readonly {
		readonly [key: string]: Value
	}[];

	pages.forEach((page, index) => {

		const { startTime, endTime } = payloads[index] ?? {};

		const stated = [ ...page.matchAll(/\b\d{1,2}\s*[:hH.]\s*\d{2}\b/g) ].map(match => match[0]);

		console.log(`${index} start=${startTime ?? "—"} end=${endTime ?? "—"}  page states: ${
			stated.length === 0 ? "«no time»" : [ ...new Set(stated) ].join(" ")
		}`);

	});

});
