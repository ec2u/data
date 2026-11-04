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

import { opt } from "@metreeca/core";
import { nameTag, type Tag } from "@metreeca/core/language";
import { by, locale } from "@metreeca/core/order";
import { Link } from "@metreeca/tile-cell/link";
import { tagIRI } from "@metreeca/work/core/language.js";
import { getIRIHost } from "@metreeca/work/core/resources.js";
import { type ComponentChildren, createElement } from "preact";
import "./links.css";


/**
 * Renders an outbound link to a web address.
 *
 * Keeps the localised versions of a page on the same site apart, setting the tag of the language the address states
 * as a small raised remark after the link and outside it, as in `www.uc.pt ᵉⁿ`, naming the language in full on hover.
 *
 * @param url The web address to be linked
 * @param fallback The tag of the language assumed for `url` if it states none, for instance the local language of the
 *   site; if omitted, addresses stating no language are left to their link alone
 *
 * @returns A link to `url` labelled by its host, or by `url` itself if it names no host, followed by the tag of the
 *   language `url` states or else by `fallback`, if any, so that the tag reads as a remark on the link
 */
export function address(url: string, fallback?: Tag): ComponentChildren {

	const link = <Link href={url}>{getIRIHost(url) ?? url}</Link>;

	return opt(tagIRI(url) ?? fallback, tag => createElement("ec2u-address", {},
		link, <span title={nameTag(tag, navigator.language)}>{tag}</span>
	)) ?? link;

}

/**
 * Renders a list of linked resources for an info panel.
 *
 * @param entries The resources to be listed, each with its identifier and label
 *
 * @returns A list of links sorted by label, or `undefined` if `entries` is empty, so that the panel omits the entry
 */
export function links(entries: readonly { readonly id: string, readonly label: string }[]): ComponentChildren {

	return entries.length > 0 ? <ul>{[...entries] // copy, as entries are shared

		.sort(by(({ label }) => label, locale()))
		.map(({ id, label }) => <li key={id}><Link href={id}>{label}</Link></li>)

	}</ul> : undefined;

}

/**
 * Renders a list of linked resources, each leading to a catalogue filtered on it.
 *
 * @param entries The resources to be listed, each with its identifier and label
 * @param catalogue The route of the catalogue the links lead to
 * @param query The criteria each link narrows the catalogue by, given the identifier of its resource
 *
 * @returns A list of links sorted by label, or `undefined` if `entries` is empty, so that the panel omits the entry
 */
export function filters(

	entries: readonly { readonly id: string, readonly label: string }[],
	catalogue: string,
	query: (id: string) => Readonly<Record<string, string>>

): ComponentChildren {

	return entries.length > 0 ? <ul>{[...entries] // copy, as entries are shared

		.sort(by(({ label }) => label, locale()))
		.map(({ id, label }) => <li key={id}><Link href={catalogue} query={query(id)}>{label}</Link></li>)

	}</ul> : undefined;

}

/**
 * Renders a list of values for an info panel.
 *
 * @param values The values to be listed
 *
 * @returns A list of the values sorted in the reader locale, or `undefined` if `values` is empty, so that the panel
 *     omits the entry
 */
export function list(values: readonly string[]): ComponentChildren {

	return values.length > 0 ? <ul>{[...values] // copy, as values are shared

		.sort(by(value => value, locale()))
		.map(value => <li key={value}>{value}</li>)

	}</ul> : undefined;

}
