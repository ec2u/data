/*
 * Copyright © 2025 Metreeca srl
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
 * @module
 *
 * Web content extraction and markdown conversion utilities.
 *
 * Implements a clean content extraction pipeline that fetches web pages, extracts main article content while removing
 *     boilerplate elements (navigation, sidebars, ads, headers, footers), and converts the result to clean markdown
 *     format.
 *
 * The pipeline uses:
 *
 * - Built-in `fetch` for HTTP requests with automatic redirect handling
 * - JSDOM for DOM manipulation in Node.js environment
 *   {@link https://github.com/jsdom/jsdom}
 * - Defuddle for intelligent content extraction, removing non-essential elements
 *   {@link https://github.com/kepano/defuddle}
 *
 * This approach provides cleaner output than direct HTML-to-Markdown conversion
 * by filtering out template and boilerplate content before conversion.
 *
 * @remarks Version Compatibility
 *
 * - **JSDOM**: Must use v24.x (currently v24.1.3) due to Defuddle peer dependency.
 *   Defuddle requires `jsdom@^24.0.0`, incompatible with newer v27.x versions.
 * - **Defuddle**: Uses Node.js-optimized import (`defuddle/node`) with ES modules.
 *   Content extraction and markdown conversion handled by Defuddle's built-in
 *   `separateMarkdown` option for integrated processing.
 */

import { Cache, HeapCache } from "@/core/cache";
import { hash, immutable } from "@/core/index";
import { log, message } from "@/core/log";
import { Defuddle, DefuddleResponse } from "defuddle/node";
import { JSDOM } from "jsdom";


/**
 * Web page data extracted and processed by the crawler.
 *
 * Contains cleaned content in markdown format, extracted links, and metadata
 * for tracking crawl state and content changes.
 */
export interface Page {

	/** Absolute URL of the crawled page */
	readonly url: string;

	/** Page title extracted from HTML or derived from URL */
	readonly title: string;

	/** Main content converted to markdown format with boilerplate removed */
	readonly content: string;

	/** Links extracted from the page with absolute URLs */
	readonly links: readonly Link[];


	/** Timestamp when the page was fetched (milliseconds since epoch) */
	readonly fetched: number;

	/** Content hash for detecting changes between crawls */
	readonly digest: string;

}

/**
 * Link data extracted from HTML anchor elements.
 */
export interface Link {

	readonly href: string;
	readonly text?: string;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Fetches content from the specified URL with error handling.
 *
 * @param url - The URL to fetch
 * @returns Promise resolving to the HTTP response
 * @throws Error if the request fails or returns non-ok status
 */
export async function get(url: string): Promise<Response> {

	const response=await fetch(url);

	if ( !response.ok ) {
		throw new Error(`failed to fetch <${url}> <${response.status} ${response.statusText}>`);
	}

	return response;
}

/**
 * Converts HTTP response to JSDOM instance for DOM manipulation.
 *
 * @param response - The HTTP response containing HTML content
 * @returns Promise resolving to JSDOM instance with parsed HTML
 */
export async function html(response: Response): Promise<JSDOM> {
	return new JSDOM(await response.text(), { url: response.url });
}

/**
 * Extracts clean content and converts to markdown using Defuddle.
 *
 * @param dom - JSDOM instance containing the HTML document
 * @returns Promise resolving to extracted content with metadata and URL
 */
export async function content(dom: JSDOM): Promise<DefuddleResponse & { url: string }> {

	const url=dom.window.location.href;

	// ;( suppress defuddle's hardcoded console.log messages (https://github.com/kepano/defuddle/issues/92)

	const originalLog=console.log;

	console.log=(msg, ...args) => {
		if ( typeof msg !== "string" || !msg.includes("Initial parse returned very little content") ) {
			originalLog(msg, ...args);
		}
	};

	try {

		const result=await Defuddle(dom, url, {
			separateMarkdown: true,
			debug: false
		});

		return { ...result, url: url };

	} finally {
		console.log=originalLog;
	}

}

/**
 * Extracts links from the DOM with their absolute URLs and text content.
 *
 * Filters out internal fragment links (those starting with #) and handles image-only links
 * by using the img alt attribute as fallback text when no text content is available.
 *
 * @param dom - JSDOM instance containing the HTML document
 * @returns Promise resolving to immutable array of link objects with href and text properties
 */
export async function links(dom: JSDOM): Promise<ReadonlyArray<Link>> {

	const base=dom.window.location.href;
	const self=base + "#";

	return Array.from(dom.window.document.querySelectorAll("a[href]"))

		.map(link => link as HTMLAnchorElement)

		.filter(link => !link.href.startsWith(self))

		.map(link => Object.freeze({
			href: new URL(link.href, base).href,
			text: link.textContent.trim() || link.querySelector("img")?.alt?.trim()
		}));
}

/**
 * Crawls a website starting from the home URL with configurable depth and concurrency.
 *
 * Performs breadth-first traversal of web pages, extracting content and following links within the same origin. Uses
 * parallel fetching for improved performance while respecting the configured concurrency limits.
 *
 * @param home - The starting URL to begin crawling from
 * @param options - Configuration options for the crawl
 * @param options.depth - Maximum crawl depth (0 for unlimited, default: 0)
 * @param options.tasks - Number of concurrent fetch operations (default: 4)
 * @param options.cache - Cache implementation for storing processed pages (default: HeapCache)
 *
 * @returns Promise resolving to immutable array of crawled pages with extracted content
 */
export async function crawl(home: string, {

	depth=0,
	tasks=4,
	cache=HeapCache<Page>()

}: Partial<{

	depth: number
	tasks: number
	cache: Cache<Page>

}>={}): Promise<ReadonlyArray<Page>> {

	const pages: Page[]=[];
	const origin=new URL(home).origin;

	const pending: Array<{ url: string; level: number }>=[{ url: home, level: 0 }];
	const visited=new Set<string>();

	while ( pending.length > 0 ) {
		await Promise.all(pending.splice(0, tasks).map(({ url, level }) => {

			visited.add(url);

			return cache.lookup(url, async function (url: string) {

					log.info(crawl.name, `fetching <${url}>`);

					const response=await get(url);
					const dom=await html(response);
					const pageContent=await content(dom);
					const pageLinks=await links(dom);

					return {
						url: url,
						title: pageContent.title || url,
						content: pageContent.contentMarkdown || "",
						links: pageLinks,
						digest: hash(pageContent.contentMarkdown || ""),
						fetched: Date.now()
					};

				})

				.then((page) => {

					pages.push(page);

					page.links
						.filter(link => !visited.has(link.href)
							&& isWithinDepthLimit(level + 1, depth)
							&& hasSameOrigin(link.href, origin)
							&& !isFile(link.href)
						)
						.forEach(link => pending.push({ url: link.href, level: level + 1 }));


					function isWithinDepthLimit(depth: number, limit: number) {
						return limit === 0 || depth <= limit;
					}

					function hasSameOrigin(url: string, origin: string): boolean {
						return new URL(url).origin === origin;
					}

					function isFile(url: string): boolean {

						const pathname=new URL(url).pathname;
						const filename=pathname.split("/").pop() || "";

						return /\.[a-zA-Z0-9]+$/.test(filename);
					}

				})

				.catch((e) => {
					log.warn(crawl.name, `failed to process <${url}>: ${message(e)}`);
				});
		}));
	}

	return immutable(pages);
}
