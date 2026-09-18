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

import type { Instant } from "@/_/core/temporal.js";
import { type Link, scrape } from "@/units/_pages/_scraper.js";
import type { Markdown, Text } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { log } from "@metreeca/tape";


export type { Link }; // the scraping vocabulary is part of the page snapshot contract


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Web page snapshot.
 *
 * Provides a deeply immutable snapshot of a web page content as of the time it was retrieved.
 */
export type Page = {

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
	 * The main page content as markdown, stripped of the navigation, headers, footers and other framing the page is
	 * built around.
	 */
	readonly content: Markdown;

	/**
	 * The outbound links of the page, in document order.
	 */
	readonly links: readonly Link[];

}


/**
 * Absolute URL.
 *
 * A scheme-qualified web address, identifying a standalone resource without resolution against a base URL.
 *
 * > [!NOTE]
 * > For documentation purposes only: values are plain strings, with no validation or type-level enforcement.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-4.3 RFC 3986 § 4.3 Absolute URI}
 */
export type Locator = string;


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
 * @returns A promise reporting the immutable {@link Page} snapshot for `url`; rejected if the page can't be looked up
 * or retrieved
 */
export type Retriever = (url: Locator) => Promise<Page>;


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
 * @throws {@link !Error Error} If the page can't be retrieved or processed
 */
export async function retrieve(url: Locator): Promise<Page> {

	logger.info`retrieving <${url}>`;

	const response = await fetch(url);

	if ( !response.ok ) {

		const status = `${response.status} ${response.statusText}`;

		logger.warning`failed to retrieve <${url}> <${status}>`;

		throw new Error(`failed to retrieve <${url}> <${status}>`);

	}

	// scraped against the address the content was served from, so that relative links resolve as the browser would

	const { title, content, links } = await scrape(await response.text(), response.url);

	return immutable({

		retrieved: Date.now(),

		url,
		title: title || url,
		content,
		links

	});

}
