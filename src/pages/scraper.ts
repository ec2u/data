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

/**
 * Web page scraping.
 *
 * Confines the DOM-dependent processing of web pages: `jsdom` types whatever compilation unit it takes part in against
 * the DOM libraries, shadowing the Node runtime typings, so this module is compiled on its own, as `tsconfig.dom.json`
 * defines, and reports its results through DOM-free types.
 *
 * @module
 */

import type { Markdown, Text } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/structures";
import { Defuddle } from "defuddle/node";
import { JSDOM } from "jsdom";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Outbound link of a web page.
 */
export interface Link {

	/**
	 * The absolute URL of the link target, resolved against the page URL.
	 */
	readonly href: string;

	/**
	 * The link anchor text, falling back to the alt text of a nested image; undefined if neither is available.
	 */
	readonly text?: string;

}

/**
 * Web page content.
 */
export interface Content {

	/**
	 * The page title, empty if the document doesn't provide one.
	 */
	readonly title: Text;

	/**
	 * The main page content as markdown, with boilerplate and images removed; empty if nothing was extracted.
	 */
	readonly content: Markdown;

	/**
	 * The outbound links of the page, in document order.
	 */
	readonly links: readonly Link[];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Extracts the content of a web page.
 *
 * @param html The HTML source of the page
 * @param url The absolute URL the page was served from, links are resolved against
 *
 * @returns The immutable content extracted from `html`
 *
 * @throws Error If the page can't be processed
 */
export async function scrape(html: string, url: string): Promise<Content> {

	const { document } = new JSDOM(html, { url }).window;

	const self = url+"#";

	// collected before the document is analyzed, as extraction strips the nodes the anchor texts are drawn from

	const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
		.filter(link => !link.href.startsWith(self))
		.map(link => immutable({
			href: new URL(link.href, url).href,
			text: link.textContent.trim() || link.querySelector("img")?.alt?.trim()
		}));

	const info = await Defuddle(document, url, {
		separateMarkdown: true,
		removeImages: true,
		debug: false
	});

	return immutable({

		title: info.title || "",
		content: info.contentMarkdown || "",

		links

	});

}
