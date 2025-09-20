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
 * - Defuddle for intelligent content extraction, removing non-essential elements
 *   {@link https://github.com/kepano/defuddle}
 * - Turndown for HTML to Markdown conversion with consistent formatting
 *   {@link https://github.com/mixmark-io/turndown}
 * - JSDOM for DOM manipulation in Node.js environment
 *   {@link https://github.com/jsdom/jsdom}
 *
 * This approach provides cleaner output than direct HTML-to-Markdown conversion
 * by filtering out template and boilerplate content before conversion.
 *
 * @remarks Version Compatibility
 *
 * - **JSDOM**: Must use v24.x (currently v24.1.3) due to Defuddle peer dependency.
 *   Defuddle requires `jsdom@^24.0.0`, incompatible with newer v27.x versions.
 * - **Defuddle**: Uses browser-style import (`defuddle`) rather than Node.js-specific
 *   import (`defuddle/node`) due to package export limitations in v0.6.6.
 * - **Turndown**: Stable at v7.x with consistent API.
 */

import Defuddle from "defuddle";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";

export interface ExtractedContent {
	title: string;
	content: string;
	markdown: string;
	author?: string;
	description?: string;
	publishedDate?: string;
	url: string;
}

export async function fetchAndExtractContent(url: string): Promise<ExtractedContent> {

	const response=await fetch(url);

	if ( !response.ok ) {
		throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
	}

	const html=await response.text();
	const dom=new JSDOM(html, { url });

	const defuddle=new Defuddle(dom.window.document);
	const result=defuddle.parse();

	const turndownService=new TurndownService({
		headingStyle: "atx",
		bulletListMarker: "-",
		codeBlockStyle: "fenced"
	});

	const markdown=turndownService.turndown(result.content);

	return {
		title: result.title || "",
		content: result.content,
		markdown,
		author: result.author,
		description: result.description,
		publishedDate: result.published,
		url
	};
}

export async function extractToMarkdown(url: string): Promise<string> {
	const extracted=await fetchAndExtractContent(url);
	return extracted.markdown;
}
