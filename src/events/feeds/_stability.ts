import { extract } from "@/events/tasks/extract.js";
import { execute } from "@/index.core.js";
import type { Value } from "@metreeca/core";
import type { Text } from "@metreeca/core/strings";
import { pipe } from "@metreeca/flow";
import { items, range } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { flat, fork, map, take } from "@metreeca/flow/tasks";
import { jpath, json, number, string } from "@metreeca/gear-json";
import { crawl, fetch } from "@metreeca/gear-url";
import { focus, html, untag } from "@metreeca/gear-xml";
import { report } from "@metreeca/tape";
import { writeFile } from "node:fs/promises";


const Search = "https://content.fw.uc.pt/v1/agenda/events/search";
const Events = "https://agenda.coimbra.pt/event";

const Items = 10;
const Runs = 3;

const Keys = [
	"event", "url", "title", "summary", "description",
	"startDate", "startTime", "endDate", "endTime",
	"entryFees", "attendanceMode", "attendanceURL",
	"venueName", "venueAddress", "venueCity",
	"imageURL", "imageCredits", "topic", "audience", "language"
];


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

	const task = extract();

	const runs = await Promise.all(Array.from({ length: Runs }, async () =>
		Promise.all(pages.map(page => attempt(task, page)))
	));

	await writeFile("/tmp/stability.json", JSON.stringify(runs, null, "\t"));

	console.log(`\nfailures per run: ${runs.map(r => r.filter(p => p === null).length).join(" ")}`);

	console.log("\nurl recovered verbatim from the frontmatter:");

	pages.forEach((page, index) => {

		const stated = /^url: "([^"]*)"$/m.exec(page)?.[1];
		const answers = runs.map(run => run[index]?.["url"]);

		console.log(`  ${index} ${answers.every(answer => answer === stated) ? "ok  " : "DIFF"} ${stated ?? "«none stated»"}`);

		if ( !answers.every(answer => answer === stated) ) {
			console.log(`       answered ${JSON.stringify(answers)}`);
		}

	});

	console.log("\nfield            presence per run    stable pages");

	Keys.forEach(key => {

		const presence = runs.map(run => run.filter(p => p?.[key] !== undefined).length);

		const stable = pages.filter((page, index) => {
			const values = runs.map(run => JSON.stringify(run[index]?.[key]));
			return values.every(value => value === values[0]);
		}).length;

		console.log(`${key.padEnd(16)} ${presence.join(" ").padEnd(20)} ${stable}/${pages.length}`);

	});

});


async function attempt(task: (feed: AsyncIterable<Text>) => unknown, page: Text) {
	try {

		return (await pipe(items([page])(task as never)(toArray())))[0] as { readonly [key: string]: Value };

	} catch ( e ) {

		console.log("  failed:", report(e).slice(0, 60));

		return null;

	}
}
