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
 * Web page snapshots.
 *
 * @module index
 */

import type { Awaitable } from "@/_/core/async.js";
import type { Markdown } from "@/_/core/markdown.js";
import type { Instant } from "@/_/core/temporal.js";
import type { Text } from "@/_/core/text.js";
import { immutable } from "@metreeca/core/deep";
import { log } from "@metreeca/tape";
import { Defuddle, DefuddleResponse } from "defuddle/node";
import { JSDOM } from "jsdom";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Web page snapshot.
 *
 * Provides a deeply immutable snapshot of a web page content as of the time it was retrieved.
 */
export interface Page {

	/**
	 * The time the page was retrieved at.
	 */
	readonly retrieved: Instant;


	/**
	 * The absolute URL the page was retrieved from.
	 */
	readonly url: Locator;

	/**
	 * The page title, falling back to the page URL if the document doesn't provide one.
	 */
	readonly title: Text;

	/**
	 * The main page content as markdown, with boilerplate and images removed.
	 */
	readonly content: Markdown;

	/**
	 * The outbound links of the page, in document order.
	 */
	readonly links: readonly Link[];

}


/**
 * An absolute URL.
 *
 * A scheme-qualified address, identifying a standalone resource without resolution against a base URL.
 *
 * > [!NOTE]
 * > This alias is for documentation purposes only: values are plain strings, with no validation or type-level
 * > enforcement.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-4.3 RFC 3986 § 4.3 Absolute URI}
 */
export type Locator = string;

/**
 * Outbound link of a web page.
 */
export interface Link {

	/**
	 * The absolute URL of the link target, resolved against the page URL.
	 */
	readonly href: Locator;

	/**
	 * The link anchor text, falling back to the alt text of a nested image; undefined if neither is available.
	 */
	readonly text?: string;

}


/**
 * Web page retriever.
 *
 * Decouples consumers from the way pages are obtained: looking up a URL reports either a page retrieved on the spot,
 * as by {@link retrieve}, or a snapshot a store already retains, possibly after retrieving and retaining it.
 *
 * Pages are identified by the exact URL they are looked up under, so consumers must supply a consistent form for a
 * store to short-circuit repeated retrievals.
 *
 * @param url The absolute URL of the page to be looked up
 *
 * @returns The immutable {@link Page} snapshot for `url`, reported either directly or as a promise rejected if the
 * page can't be looked up or retrieved
 */
export type Retriever = (url: Locator) => Awaitable<Page>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Retrieves a web page.
 *
 * Fetches the page and reports it as a {@link Page} snapshot identified by the requested URL, rather than by the
 * address the content was eventually served from.
 *
 * @param url The absolute URL of the page to be retrieved
 *
 * @returns The immutable snapshot of the processed page
 *
 * @throws Error If the page can't be retrieved or processed
 */
export async function retrieve(url: Locator): Promise<Page> {

	logger.info`retrieving <${url}>`;

	const dom = await get(url);
	const info = await analyze(dom);
	const links = await relate(dom);

	const title = info.title || url;
	const content = info.contentMarkdown || "";

	return immutable({

		retrieved: Date.now(),

		url,
		title,
		content,
		links

	});


	async function get(url: Locator): Promise<JSDOM> {

		const response = await fetch(url);

		if ( !response.ok ) {

			const status = `${response.status} ${response.statusText}`;

			logger.warning`failed to retrieve <${url}> <${status}>`;

			throw new Error(`failed to retrieve <${url}> <${status}>`);

		}

		const text = await response.text();

		return new JSDOM(text, { url: response.url });

	}

	async function analyze(dom: JSDOM): Promise<DefuddleResponse> {

		const url = dom.window.location.href;

		return await Defuddle(dom, url, {
			separateMarkdown: true,
			removeImages: true,
			debug: false
		});

	}

	async function relate(dom: JSDOM): Promise<readonly Link[]> {

		const base = dom.window.location.href;
		const self = base+"#";

		return Array.from(dom.window.document.querySelectorAll<HTMLAnchorElement>("a[href]"))
			.filter(link => !link.href.startsWith(self))
			.map(link => immutable({
				href: new URL(link.href, base).href,
				text: link.textContent.trim() || link.querySelector("img")?.alt?.trim()
			}));
	}

}
