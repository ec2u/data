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

import { Defuddle, DefuddleResponse } from "defuddle/node";
import { JSDOM } from "jsdom";


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

	const result=await Defuddle(dom, url, {
		separateMarkdown: true
	});

	return { ...result, url: url };
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
