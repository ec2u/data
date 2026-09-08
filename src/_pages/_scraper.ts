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
 * Confines the markup processing of web pages: consumers hand over a retrieved page and read back its title, its main
 * content as markdown and its outbound links, without dealing with markup themselves.
 *
 * @module
 */

import { isDefined } from "@metreeca/core";
import type { Markdown, Text } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/structures";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { focus, html, untag } from "@metreeca/gear-xml";
import type { AnyNode, Document, Element } from "domhandler";
import { isTag } from "domhandler";
import { findAll, findOne, getAttributeValue, textContent } from "domutils";



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Outbound link of a web page.
 */
export type Link = {

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
export type Content = {

	/**
	 * The page title, empty if the document doesn't provide one.
	 */
	readonly title: Text;

	/**
	 * The main page content as markdown, stripped of the navigation, headers, footers and other framing the page is
	 * built around; empty if nothing was extracted.
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
 * @param page The HTML source of the page
 * @param url The absolute URL the page was served from, links are resolved against
 *
 * @returns The immutable content extracted from `page`
 *
 * @throws {@link !Error Error} If the page can't be processed
 */
export async function scrape(page: string, url: string): Promise<Content> {

	const [ tree ] = await pipe(
		(items(page))
		(html())
		(toArray())
	);

	const [ main ] = await pipe(
		(items(tree))
		(focus())
		(toArray())
	);

	const [ content = "" ] = await pipe(
		(items(main && region(main)))
		(untag())
		(toArray())
	);

	return immutable({

		title: main === undefined ? "" : title(main),
		content,

		// drawn from the whole page, as extraction leaves out the framing most outbound links are stated in

		links: tree === undefined ? [] : links(tree, url)

	});

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Selects the region of an extracted document the content is converted from.
 *
 * @param main The document holding the extracted content
 *
 * @returns The `body` of `main`, where the page it was extracted from is handed on as a page, or `main` itself, where
 * it is handed on as a bare fragment
 */
function region(main: Document): AnyNode {
	return findOne(node => node.name === "body", main, true) ?? main;
}

/**
 * Extracts the title of an extracted document.
 *
 * @param main The document holding the extracted content
 *
 * @returns The title stated by `main`, empty if it states none
 */
function title(main: Document): Text {

	const heading = findOne(node => node.name === "title", main, true);

	return heading === null ? "" : textContent(heading).trim();

}


/**
 * Extracts the outbound links of a parsed page.
 *
 * @param tree The parsed page
 * @param url The absolute URL the page was served from, links are resolved against, unless the page states a base of
 * its own
 *
 * @returns The immutable links stated by `tree`, in document order, excluding the ones pointing inside the page itself
 * and the ones stating a reference that doesn't resolve
 */
function links(tree: Document, url: string): readonly Link[] {

	const base = tree.children.filter(isTag)
		.map(root => getAttributeValue(root, "xml:base"))
		.find(value => isDefined(value)) ?? url;

	const self = `${base}#`;

	return findAll(node => node.name === "a", tree)
		.map(anchor => link(anchor, base))
		.filter(value => isDefined(value))
		.filter(link => !link.href.startsWith(self));

}

/**
 * Extracts an outbound link from an anchor.
 *
 * @param anchor The anchor stating the link
 * @param base The absolute URL the link is resolved against
 *
 * @returns The immutable link stated by `anchor`, undefined if it states no reference or one that doesn't resolve
 * against `base`
 */
function link(anchor: Element, base: string): undefined | Link {

	const href = resolve(getAttributeValue(anchor, "href"), base);

	return href === undefined ? undefined : immutable({

		href,
		text: textContent(anchor).trim() || alt(anchor)

	});

}

/**
 * Extracts the alternative text of an anchor.
 *
 * @param anchor The anchor to be inspected
 *
 * @returns The alternative text of the first image nested inside `anchor`, undefined if it nests none or one stating
 * no alternative text
 */
function alt(anchor: Element): undefined | Text {

	const image = findOne(node => node.name === "img", anchor, true);

	return image === null ? undefined : getAttributeValue(image, "alt")?.trim();

}

/**
 * Resolves a reference against a base URL.
 *
 * @param href The reference to be resolved, possibly undefined
 * @param base The absolute URL `href` is resolved against
 *
 * @returns The absolute URL `href` resolves to, undefined if `href` is undefined or doesn't resolve against `base`
 */
function resolve(href: undefined | string, base: string): undefined | string {

	try {

		return href === undefined ? undefined : new URL(href, base).href;

	} catch { // a reference that doesn't resolve is not a target a consumer can retrieve

		return undefined;

	}

}
