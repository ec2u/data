/*
 * Copyright © 2026 Metreeca srl
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
 * Per-request noise removal for parsed HTML pages.
 *
 * Provides the {@link denoise} task, which clears parsed pages of the markup that changes on every request without any
 * change to their content, so that a page read on successive runs yields the same tree, the same rendering and the
 * same digest until its content actually changes, and so that downstream readers see the content as it is meant.
 *
 * ```typescript
 * import { denoise } from "@metreeca/work/mime-xml/denoise.js";
 *
 * pipe(
 *   (items(urls))
 *   (fetch())
 *   (html())
 *   (denoise())
 *   (untag())
 * );
 * ```
 *
 * Incubated here until it settles, then due to move to `@metreeca/mime-xml`.
 *
 * @module
 */

import { type Some, some } from "@metreeca/core/arrays";
import type { Task } from "@metreeca/flow";
import { map } from "@metreeca/flow/tasks";
import type { Document, Element } from "domhandler";
import { cloneNode, Text } from "domhandler";
import { existsOne, findAll } from "domutils";


/**
 * The rules every page is scrubbed by.
 */
const Defaults = [
	cfemail
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a page scrubber.
 *
 * The task converts a feed of parsed HTML pages into a feed of the same pages cleared of per-request noise, one page
 * per input, so that a page whose content didn't change yields the same rendering and digest on every read. Pages are
 * scrubbed by the default rules first, currently {@link cfemail}, then by the extra `rules`, in the order given.
 *
 * Input trees are left untouched: a page carrying noise is scrubbed into a new tree, and one carrying none is passed
 * through as it stands. Base URLs recorded on the input trees are kept, so relative links still resolve against the
 * address a page was retrieved from, and renderings still state that address as the page URL.
 *
 * @param rules Extra rules for noise peculiar to a source, applied after the defaults; each argument is a bare rule, a
 *   collection of rules, or `undefined` for none, so a rule set built by a helper is passed without a spread
 *
 * @returns A task converting a feed of parsed HTML pages into a feed of the same pages cleared of per-request noise
 *
 * @throws {@link !Error Error} While the feed is consumed, if the source feed fails
 */
export function denoise(...rules: readonly Some<(document: Document) => Document>[]): Task<Document, Document> {

	const applied = [...Defaults, ...rules.flatMap(rule => some(rule))];

	return map(document => applied.reduce((scrubbed, rule) => rule(scrubbed), document));

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Decodes the e-mail addresses Cloudflare obfuscates.
 *
 * Cloudflare e-mail obfuscation replaces each address on a page with a payload encrypted under a key drawn anew on
 * every request, so an unchanged page reads differently on each load and the address itself is lost to readers. The
 * rule restores the plain address wherever the page carries an obfuscated one in either of the forms below:
 *
 * - an element marked with the `__cf_email__` class and holding the payload in its `data-cfemail` attribute has its
 *   content replaced by the address as text, so the address reads as it was written
 * - a link whose target is the `/cdn-cgi/l/email-protection` path, relative or absolute, with the payload as fragment
 *   is retargeted to the `mailto:` URL of the address, so the link opens a message to it
 *
 * A payload that can't be decoded is left as it stands.
 *
 * @param document The parsed page to be scrubbed
 *
 * @returns A tree holding the content of `document` with Cloudflare obfuscated addresses restored in plain form
 *
 * @see [Cloudflare E-mail Address Obfuscation][cloudflare]
 *
 * [cloudflare]: https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/
 */
export function cfemail(document: Document): Document {

	return existsOne(obfuscated, document)
		? restore(cloneNode(document, true))
		: document;


	function restore(copy: Document): Document {

		// domhandler trees are doubly linked and offer no persistent construction API, so the restored tree is edited
		// in place on a private deep copy, never on the input tree the caller still holds

		findAll(obfuscated, copy).forEach(element => {

			const address = text(element);
			const target = link(element);

			if ( address !== undefined ) {

				const node = new Text(address);

				node.parent = element;
				element.children = [node];

			}

			if ( target !== undefined ) {
				element.attribs = { ...element.attribs, href: `mailto:${target}` };
			}

		});

		return copy;

	}

	function obfuscated(element: Element): boolean {
		return text(element) !== undefined || link(element) !== undefined;
	}

	function text(element: Element): undefined | string {

		const classes = (element.attribs["class"] ?? "").split(/\s+/);
		const payload = element.attribs["data-cfemail"];

		return classes.includes("__cf_email__") && payload !== undefined ? decode(payload) : undefined;

	}

	function link(element: Element): undefined | string {

		// the protection path, relative or absolute, capturing the payload fragment

		const payload = /^(?:[a-z][a-z0-9+.-]*:\/\/[^/?#]*)?\/cdn-cgi\/l\/email-protection#(.*)$/i
			.exec(element.attribs["href"] ?? "")?.[1];

		return element.name === "a" && payload !== undefined ? decode(payload) : undefined;

	}

	function decode(payload: string): undefined | string {

		if ( /^(?:[0-9a-f]{2}){2,}$/i.test(payload) ) { // a key byte followed by at least one encoded byte

			const [key = 0, ...bytes] = Array.from(payload.matchAll(/../g), ([pair]) => parseInt(pair, 16));

			try {

				return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes, byte => byte ^ key));

			} catch { // a payload decoding into malformed UTF-8 is not an address

				return undefined;

			}

		} else {

			return undefined;

		}

	}

}
