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

import { isObject, isString, opt, type Optional, type URLLike } from "@metreeca/core";
import { type Markdown, markdown } from "@metreeca/core/strings";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { flat, map, trim } from "@metreeca/flow/tasks";
import { focus, html, string, untag, xpath } from "@metreeca/mime-xml";
import { fetch } from "@metreeca/pipe-url";
import type { AnyNode } from "domhandler";


/**
 * Creates a source page reader.
 *
 * Reads each source page into the markdown document the extractor works on: the main content of the page, free of
 * navigation and listings, or, where the page carries no main content, the schema.org `Event` it embeds as JSON-LD,
 * rendered as a document of its own. A page rendering its content client-side thus still yields its event where the
 * site publishes structured data for it. A page yielding neither is left to the next run.
 *
 * A page that fails to be read, as when its host cannot be reached, is skipped and left to the next run as well, so
 * that one unreachable page costs that page alone rather than every page listed after it in the feed.
 *
 * @returns A task converting a feed of page addresses into a feed of documents, at most one per page
 */
export function read(): Task<URLLike, Markdown> {

	const retrieve = fetch(); // created outside the guard, so that a missing executor is not taken for a failed page

	return urls => pipe(
		(items(urls))
		(flat(map(url => pipe(
			(items([url]))
			(retrieve)
			(html())
			(trim(map((tree) => opt(focus(tree), untag, () => embedded(tree)))))
			(toArray())
		).catch(() => [])))) // the failure of a page costs that page alone, leaving it to the next run
	);


}

/**
 * Renders the structured data of a page.
 *
 * Finds the first `application/ld+json` script of the page holding an object typed as a schema.org `Event` and renders
 * it as a markdown document opening with a frontmatter block stating its name and address, so that a page carrying
 * its event as structured data alone reads to the extractor like a page carrying it as prose. Blocks that fail to
 * parse and objects of other types describe no event and are skipped, so that a malformed block cannot hide an event.
 *
 * @param tree The parsed page
 *
 * @returns The document rendered from the first event the page embeds, or `undefined` if it embeds none
 */
export function embedded(tree: AnyNode): Optional<Markdown> {

	const event = xpath(tree)("//script[@type='application/ld+json']")
		.map(node => parse(string(node)))
		.find(isEvent);

	return opt(event, render);


	function isEvent(value: unknown): value is Record<PropertyKey, unknown> {
		return isObject(value) && value["@type"] === "Event";
	}

	function parse(text: string): unknown {
		try {

			return JSON.parse(text);

		} catch {

			return undefined;

		}
	}

	function render(event: Record<PropertyKey, unknown>): Markdown {

		const location = isObject(event.location) ? event.location : {};
		const address = isObject(location.address) ? location.address : {};

		const name = text(event.name);

		const place = [location.name, address.streetAddress, address.addressLocality, address.addressCountry]
			.filter(isString)
			.join(", ");

		const image = Array.isArray(event.image) ? event.image[0] : event.image;

		const facts = [
			["Start", text(event.startDate)],
			["End", text(event.endDate)],
			["Attendance", text(event.eventAttendanceMode)],
			["Location", place],
			["Image", text(image)]
		].filter(([, value]) => value !== "");

		// interpolated whole: a multi-line description laid out inside the template would defeat its realignment

		return markdown`${[
			"---",
			`title: "${name.replaceAll("\"", "\\\"")}"`,
			`url: "${text(event.url)}"`,
			"---",
			"",
			`# ${name}`,
			"",
			text(event.description),
			"",
			...facts.map(([label, value]) => `- ${label}: ${value}`)
		].join("\n")}`;

	}

	function text(value: unknown): string {
		return isString(value) ? value : "";
	}

}
