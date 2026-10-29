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

import type { Task } from "@metreeca/flow";
import { map } from "@metreeca/flow/tasks";
import type { Document, Element } from "domhandler";
import { cloneNode, Text } from "domhandler";
import { existsOne, findAll } from "domutils";


/**
 * The rules every page is denoised by.
 */
const Defaults = [
	cfemail
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a page denoiser.
 *
 * The task converts a feed of parsed HTML pages into a feed of the same pages cleared of per-request noise, one page
 * per input, so that a page whose content didn't change yields the same rendering and digest on every read. Pages are
 * denoised by the default rules first, currently {@link cfemail}, then by the extra `rules`, in the order given.
 *
 * Input trees are left untouched: a page carrying noise is denoised into a new tree, and one carrying none is passed
 * through as it stands. Base URLs recorded on the input trees are kept, so relative links still resolve against the
 * address a page was retrieved from, and renderings still state that address as the page URL.
 *
 * @param rules Extra rules for noise peculiar to a source, applied after the defaults in the order given
 *
 * @returns A task converting a feed of parsed HTML pages into a feed of the same pages cleared of per-request noise
 *
 * @throws {@link !Error Error} While the feed is consumed, if the source feed fails
 */
export function denoise(...rules: readonly ((document: Document) => Document)[]): Task<Document, Document> {

	const applied = [...Defaults, ...rules];

	return map(document => applied.reduce((denoised, rule) => rule(denoised), document));

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Decodes Cloudflare-obfuscated e-mail addresses.
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
 * @param document The parsed page to be denoised
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

			const shown = shownAddress(element);
			const linked = linkedAddress(element);

			if ( shown !== undefined ) {

				const node = new Text(shown);

				node.parent = element;
				element.children = [node];

			}

			if ( linked !== undefined ) {
				element.attribs = { ...element.attribs, href: `mailto:${linked}` };
			}

		});

		return copy;

	}

	function obfuscated(element: Element): boolean {
		return shownAddress(element) !== undefined || linkedAddress(element) !== undefined;
	}

	function shownAddress(element: Element): undefined | string {

		const payload = (element.attribs["class"] ?? "").split(/\s+/).includes("__cf_email__")
			? element.attribs["data-cfemail"]
			: undefined;

		return payload === undefined ? undefined : decode(payload);

	}

	function linkedAddress(element: Element): undefined | string {

		const payload = element.name === "a"
			? /^(?:[a-z][a-z0-9+.-]*:\/\/[^/?#]*)?\/cdn-cgi\/l\/email-protection#(.*)$/i.exec(element.attribs["href"] ?? "")?.[1]
			: undefined;

		return payload === undefined ? undefined : decode(payload);

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
