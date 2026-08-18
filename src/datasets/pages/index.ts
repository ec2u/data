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
 * Web page crawling and markdown extraction.
 *
 * Provides {@link scrape} for retrieving a web page as a {@link Page} record reporting its title, summary, main
 * content as markdown and outbound {@link Link}s, and {@link visit} for reporting the same record through a
 * {@link Cache}, alongside the {@link normalize}, {@link get}, {@link html}, {@link content} and {@link links} steps
 * they are assembled from, for callers driving the pipeline themselves.
 *
 * Navigation, sidebars, ads, headers, footers and other boilerplate are stripped before conversion, so the reported
 * content is limited to the main article body and reads more cleanly than a direct HTML to markdown translation.
 * Retrieval and summarisation are pluggable: a {@link Cache} decides whether a page is retrieved at all, so that
 * repeated visits to the same URL are short-circuited, while a {@link Summarist} replaces the summary derived from
 * page metadata.
 *
 * Companion modules build on these features: `store.ts` creates a Google Cloud Datastore-backed {@link Cache}, while
 * `tools/fetchPage.ts` exposes {@link visit} as a Gemini function-calling tool.
 *
 * @see {@link https://github.com/jsdom/jsdom JSDOM}
 * @see {@link https://github.com/kepano/defuddle Defuddle}
 *
 * @module index
 */

import type { Factory } from "@/_/core/cache.js";
import type { Instant } from "@/_/core/temporal.js";
import { immutable } from "@metreeca/core/deep";
import { log } from "@metreeca/tape";
import { Defuddle, DefuddleResponse } from "defuddle/node";
import { JSDOM } from "jsdom";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Web page snapshot.
 *
 * Describes a page as of the time it was retrieved. Snapshots are deeply immutable and never refreshed, so a later
 * visit may well report different content for the same URL.
 */
export interface Page {

	/**
	 * The {@link Instant} the page was retrieved at.
	 */
	readonly retrieved: Instant;


	/**
	 * The absolute URL the page was retrieved from, normalised as by {@link normalize}.
	 */
	readonly url: string;

	/**
	 * The page title, falling back to the page URL if the document doesn't provide one.
	 */
	readonly title: string;

	/**
	 * A single-line summary of the page content.
	 */
	readonly summary: string;

	/**
	 * The main page content as markdown, with boilerplate and images removed.
	 */
	readonly content: string;

	/**
	 * The outbound links of the page, in document order.
	 */
	readonly links: readonly Link[];

}

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
 * Store retaining processed web pages across visits.
 *
 * Decouples {@link visit} from the storage strategy: looking up a normalised page URL reports the retained page, or
 * the page reported by the fetcher the store was created around, for instance {@link scrape}, after retaining it.
 * Implementations are free to retain pages in memory, on disk or in a remote store, and to report them either
 * synchronously or asynchronously.
 *
 * @see {@link Factory}
 */
export type Cache = Factory<string, Page | Promise<Page>>;

/**
 * Generator of web page summaries.
 *
 * Replaces the summary {@link scrape} derives from page metadata, for instance with an LLM-generated abstract.
 */
export interface Summarist {

	/**
	 * Summarises the content of a page.
	 *
	 * @param page The URL, title and markdown content of the page to summarise
	 *
	 * @returns The summary generated for `page`
	 */
	(page: Pick<Page, "url" | "title" | "content">): Promise<string>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Normalises a page URL.
 *
 * Rewrites the URL to the canonical form used as a page identity throughout this module, upgrading the `http` scheme
 * to `https` and applying the parsing rules of the URL standard, so that variants of the same address are compared
 * and stored as a single page.
 *
 * @param url The URL to normalise
 *
 * @returns The normalised form of `url`
 *
 * @throws TypeError If `url` isn't a valid absolute URL
 *
 * @see {@link https://url.spec.whatwg.org/ WHATWG URL Standard}
 */
export function normalize(url: string): string {

	const parsed = new URL(url);

	if ( parsed.protocol === "http:" ) {
		parsed.protocol = "https:";
	}

	return parsed.href;
}

/**
 * Retrieves a web resource.
 *
 * @param url The absolute URL of the resource to retrieve
 *
 * @returns The successful response reported for `url`, with redirects already followed
 *
 * @throws Error If the request fails or the server reports an unsuccessful HTTP status
 *
 * @see {@link https://fetch.spec.whatwg.org/ WHATWG Fetch Standard}
 */
export async function get(url: string): Promise<Response> {

	const response = await fetch(url);

	if ( !response.ok ) {
		throw new Error(`failed to fetch <${url}> <${response.status} ${response.statusText}>`);
	}

	return response;
}

/**
 * Parses an HTTP response into a DOM document.
 *
 * @param response The response whose body is to be parsed as HTML
 *
 * @returns A DOM view of the `response` body, based at the final response URL, so that relative references are
 * resolved against the address the content was actually served from
 */
export async function html(response: Response): Promise<JSDOM> {

	return new JSDOM(await response.text(), { url: response.url });

}

/**
 * Extracts the main content of a document as markdown.
 *
 * Strips navigation, sidebars, ads, headers, footers and other boilerplate, reporting the remaining article body as
 * markdown, without images, alongside the metadata Defuddle derives from the document.
 *
 * @param dom The DOM document to extract content from
 *
 * @returns The extracted content and metadata, extended with the URL `dom` is based at
 *
 * @throws Error If the document can't be processed
 */
export async function content(dom: JSDOM): Promise<DefuddleResponse & { url: string }> {

	const url = dom.window.location.href;

	const result = await Defuddle(dom, url, {
		separateMarkdown: true,
		removeImages: true,
		debug: false
	});

	return { ...result, url };

}

/**
 * Extracts the outbound links of a document.
 *
 * Reports one {@link Link} for each anchor with an `href`, resolved to an absolute URL against the document base;
 * links to fragments of the document itself are ignored, and anchors wrapping an image with no text of their own
 * report the image alt text.
 *
 * @param dom The DOM document to extract links from
 *
 * @returns An immutable array of frozen links, in document order
 */
export async function links(dom: JSDOM): Promise<readonly Link[]> {

	const base = dom.window.location.href;
	const self = base+"#";

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
 * Scrapes a web page.
 *
 * Retrieves the page and extracts its title, summary, main content as markdown and outbound links, reporting them as a
 * {@link Page} identified by the normalised page URL. The page is always retrieved: wire this function into a
 * {@link Cache} and go through {@link visit} to short-circuit repeated retrievals of the same URL.
 *
 * @param url The URL of the page to scrape, normalised as by {@link normalize} before retrieval
 * @param options The page processing options
 * @param options.summarist The generator of the page summary; if undefined, the summary is taken from the page meta
 * description, falling back to a truncated content excerpt
 *
 * @returns The immutable snapshot of the processed page, with its summary reduced to a single line
 *
 * @throws Error If the page can't be retrieved, processed or summarised
 */
export async function scrape(url: string, {

	summarist

}: {

	readonly summarist?: Summarist

} = {}): Promise<Page> {

	const target = normalize(url);

	logger.info`fetching <${target}>`;

	const response = await get(target);
	const dom = await html(response);
	const pageContent = await content(dom);
	const pageLinks = await links(dom);

	const title = pageContent.title || target;
	const text = pageContent.contentMarkdown || "";

	const summary = await summarist?.({ url: target, title, content: text })
		|| pageContent.description
		|| text.substring(0, 500-1)+"…";

	return immutable({

		retrieved: Date.now(),

		url: target,
		title,
		summary: summary.replaceAll(/\s+/g, " "),
		content: text,
		links: pageLinks

	});

}

/**
 * Visits a web page.
 *
 * Looks the page up in the configured {@link Cache} under its normalised URL, so that pages already retained are
 * reported without being retrieved again; pages the cache doesn't hold are retrieved and processed on demand by the
 * fetcher it was created around, which is also where summarisation is configured.
 *
 * @param url The URL of the page to visit, normalised as by {@link normalize} before lookup
 * @param options The page lookup options
 * @param options.cache The store consulted for the page; defaults to {@link scrape}, retaining nothing, so that every
 * visit retrieves the page again
 *
 * @returns The immutable snapshot of the page reported by `options.cache`
 *
 * @throws Error If the page can't be looked up, retrieved, processed or summarised
 */
export async function visit(url: string, {

	cache = scrape

}: {

	readonly cache?: Cache

} = {}): Promise<Page> {

	return cache(normalize(url));

}
