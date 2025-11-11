/*
 * Copyright © 2020-2025 EC2U Alliance
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

import { uuid } from "@/utilities/node/uuid";
import { log } from "@metreeca/post";
import { Defuddle, DefuddleResponse } from "defuddle/node";
import { JSDOM } from "jsdom";


const logger = log(import.meta.url);


/**
 * Web page data extracted and processed by the crawler.
 *
 * Contains cleaned content in markdown format, extracted links, and metadata
 * for tracking crawl state and content changes.
 */
export interface Page {

	/** Timestamp when the page was fetched (milliseconds since epoch) */
	readonly fetched: number;

	/** Content uuid for detecting changes between crawls */
	readonly digest: string;


	/** Absolute URL of the crawled page */
	readonly url: string;

	/** Page title extracted from HTML or derived from URL */
	readonly title: string;

	readonly summary: string;

	/** Main content converted to markdown format with boilerplate removed */
	readonly content: string;

	/** Links extracted from the page with absolute URLs */
	readonly links: readonly Link[];

}

/**
 * Link data extracted from HTML anchor elements.
 */
export interface Link {

	readonly href: string;
	readonly text?: string;

}


/**
 * Cache function for storing and retrieving processed web pages.
 *
 * Retrieves a cached page by URL or generates it using the provided fetcher function if not present in the cache.
 * Supports both synchronous and asynchronous cache implementations.
 *
 * @param url - The URL to look up in the cache
 * @param fetcher - Function to generate the page if not cached
 *
 * @returns The cached or newly generated page (may be returned synchronously or asynchronously)
 */
export interface Cache {

	(url: string, fetcher: (url: string) => Page | Promise<Page>): Page | Promise<Page>;

}

/**
 * Function that generates a summary from page content.
 */
export interface Summarist {

	(page: Pick<Page, "url" | "title" | "content">): Promise<string>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Normalizes a URL by ensuring it has a pathname.
 *
 * Converts URLs with empty pathnames to include a root path ("/"), ensuring consistent URL format for comparison
 * and caching operations.
 *
 * @param url - The URL to normalize
 *
 * @returns The normalized URL with guaranteed pathname
 */
export function normalize(url: string): string {

	const parsed=new URL(url);

	if ( parsed.pathname === "" ) {
		parsed.pathname="/";
	}

	return parsed.href;
}

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
			removeImages: true,
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
 *
 * @returns Promise resolving to immutable array of link objects with href and text properties
 */
export async function links(dom: JSDOM): Promise<ReadonlyArray<Link>> {

	const base=dom.window.location.href;
	const self=base+"#";

	return Array.from(dom.window.document.querySelectorAll("a[href]"))

		.map(link => link as HTMLAnchorElement)

		.filter(link => !link.href.startsWith(self))

		.map(link => Object.freeze({
			href: new URL(link.href, base).href,
			text: link.textContent.trim() || link.querySelector("img")?.alt?.trim()
		}));
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Fetches and processes a single web page, extracting content and metadata.
 *
 * Retrieves the page from the specified URL, extracts clean markdown content, links, and metadata. Uses caching to
 * avoid redundant fetches of the same URL. Optionally generates a summary using a provided summarist function,
 * falling back to the page's meta description or content excerpt.
 *
 * @param url - The URL of the page to visit
 * @param options - Configuration options for page processing
 * @param options.cache - Cache implementation for storing processed pages (default: pass-through)
 * @param options.summarist - Optional function to generate custom summaries from page content
 *
 * @returns Promise resolving to processed page with extracted content and metadata
 */
export async function visit(url: string, {

	cache=(url, fetcher) => fetcher(url),

	summarist

}: Partial<{

	cache: Cache

	summarist: Summarist

}>={}): Promise<Page> {

	return cache(normalize(url), async function (url: string) {

		logger.info`fetching <${url}>`;

		const response=await get(url);
		const dom=await html(response);
		const pageContent=await content(dom);
		const pageLinks=await links(dom);

		const text=pageContent.contentMarkdown || "";
		const title=pageContent.title || url;

		logger.info`summarizing <${url}>`;

		const summary=await summarist?.({ url, title, content: text })
			|| pageContent.description
			|| text.substring(0, 500-1)+"…";

		return {
			url,
			title: title,
			content: text,
			links: pageLinks,
			digest: uuid(text),
			fetched: Date.now(),
			summary: summary.replaceAll(/\s+/g, " ")
		};

	});

}
