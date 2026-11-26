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

import { type AnyNode, cloneNode, type Element, isTag } from "domhandler";
import { findAll } from "domutils";


/**
 * Image addresses of sites that state a version drawn anew for each page view as their `v` query parameter.
 */
const CacheBusted = /^https:\/\/www\.umu\.se\//;


/**
 * Drops the cache busters known sites rotate on image addresses.
 *
 * Meant as a `denoise()` rule for pages whose digest decides whether they are extracted again: an image address
 * carrying a version the site draws anew for each page view would otherwise make an unchanged page look changed on
 * every run. Addresses stated relative to the page are matched against the site the page belongs to and returned
 * resolved against it. Images of other sites, and query parameters other than the version, are kept as stated.
 *
 * @param tree The parsed page
 *
 * @returns A copy of `tree` stating its image addresses without the rotating version, leaving `tree` as it stands
 */
export function unbust(tree: AnyNode): AnyNode {

	// domhandler offers no persistent construction API: edit a private deep copy, as denoise() rules must
	// leave their input tree as it stands for the caller still holding it and for the rules applied after

	const copy = cloneNode(tree, true);

	findAll(isBusted, [copy]).forEach(image => {
		image.attribs = { ...image.attribs, src: unversioned(resolved(image) ?? "") };
	});

	return copy;


	function isBusted(element: Element): boolean {

		const src = resolved(element);

		return element.name === "img"
			&& src !== undefined
			&& CacheBusted.test(src)
			&& URL.parse(src)?.searchParams.has("v") === true;

	}

	function resolved(element: Element): undefined | string {
		return URL.parse(element.attribs["src"] ?? "", base(element))?.href;
	}

	function base(node: null | AnyNode): undefined | string {
		return node === null ? undefined
			: isTag(node) && node.attribs["xml:base"] !== undefined ? node.attribs["xml:base"]
				: base(node.parent);
	}

	function unversioned(src: string): string {

		const url = new URL(src);

		url.searchParams.delete("v");

		return url.href;

	}

}
