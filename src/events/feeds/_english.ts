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

const Runs = 1;

// function words that occur in running Portuguese prose and not in English

const Portuguese = /\b(?:de|da|do|das|dos|em|no|na|nos|nas|para|com|uma|não|que|são|será|pelo|pela|até|também)\b/gi;

const Prose = [ "title", "summary", "description", "topic", "audience" ];


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

	const task = extract();

	const runs = await Promise.all(Array.from({ length: Runs }, async () =>
		await pipe(items(pages)(task)(toArray())) as readonly { readonly [key: string]: Value }[]
	));

	runs.forEach((run, index) => {

		const marked = run.flatMap((payload, page) => Prose.flatMap(key => {

			const value = payload[key];
			const hits = typeof value === "string" ? [ ...value.matchAll(Portuguese) ].length : 0;

			return hits > 0 ? [ `\n  ${page}.${key}: ${String(value).replace(/\s+/g, " ").slice(0, 150)}` ] : [];

		}));

		console.log(`run ${index}: ${marked.length === 0 ? "all English" : marked.join(" ")}`);

	});

	console.log("\nrun 0 titles and topics:");

	runs[0]?.forEach((payload, page) => console.log(
		`  ${page} [${payload["language"]}] event=${payload["event"]} desc=${String(payload["description"] ?? "").length} sum=${String(payload["summary"] ?? "").length} topic=${payload["topic"] ?? "—"}`
	));

});
