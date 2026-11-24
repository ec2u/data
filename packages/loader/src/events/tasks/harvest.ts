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

import {
	isAny,
	isArray,
	isObject,
	isOptional,
	isString,
	isUnion,
	key,
	opt,
	type Optional,
	type URLLike
} from "@grafctory/core";
import { type Some, some } from "@grafctory/core/arrays";
import { type Markdown, markdown } from "@grafctory/core/strings";
import { pipe, type Task } from "@grafctory/flow";
import { items } from "@grafctory/flow/feeds";
import { coalesce, map, trim } from "@grafctory/flow/tasks";
import { denoise, focus, html, untag, unwrap } from "@grafctory/mime-xml";
import { fetch } from "@grafctory/pipe-url";
import { type AnyNode, cloneNode, type Element } from "domhandler";
import { findAll } from "domutils";


/**
 * Image addresses of sites that state a version drawn anew for each page view as their `v` query parameter.
 */
const CacheBusted = /^https:\/\/www\.umu\.se\//;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * A schema.org `Event` embedded in a page as JSON-LD.
 *
 * Its name, web address and description are always stated; its other facts may be missing, but are never malformed.
 */
type EmbeddedEvent = {

	readonly "@type": "Event"

	readonly name: string
	readonly url: string
	readonly description: string

	readonly startDate?: string
	readonly endDate?: string
	readonly eventAttendanceMode?: string

	readonly location?: {

		readonly name?: string

		readonly address?: string | {
			readonly streetAddress?: string
			readonly addressLocality?: string
			readonly addressCountry?: string
		}

	}

	readonly image?: Some<string | { readonly url: string }>

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a source page harvester.
 *
 * Reads each source page into a markdown document for the extractor: the main content of the page, free of navigation
 * and listings, or, if the page carries no main content, the schema.org `Event` it embeds as JSON-LD, rendered as a
 * document of its own. A page rendering its content client-side thus still yields its event if the site publishes
 * structured data for it. A page yielding neither is skipped and left to the next run.
 *
 * Pages are cleared of the noise that changes on every request before they are read, so an unchanged page yields the
 * same document on every run, and addresses a site obfuscates reach the extractor in plain form. Image addresses drop
 * the version known sites draw anew for each page view, so a rotating cache buster never passes for a content change.
 *
 * The rendered event is the first stating a name, a web address and a description. Its document opens with a
 * frontmatter block stating its title and web address. Blocks that fail to parse are skipped, so a malformed block
 * cannot hide an event. An event stating any malformed fact, such as a date that is not text, is rejected as a whole.
 *
 * A page that fails to be read, as when its host cannot be reached, is skipped and left to the next run as well, so
 * that one unreachable page costs that page alone rather than every page listed after it in the feed.
 *
 * @returns A task converting a feed of page addresses into a feed of documents, at most one per page
 */
export function harvest(): Task<URLLike, Markdown> {

	return urls => pipe(
		(items(urls))
		(fetch())
		(html())
		(denoise(unbust))
		(coalesce(
			trees => pipe(
				items(trees)
				(focus())
				(untag())
			),
			trees => pipe(
				items(trees)
				(unwrap())
				(trim(map(values => values.find(isEvent))))
				(map(render))
			)
		))
	);


	function unbust(tree: AnyNode): AnyNode {

		// domhandler offers no persistent construction API: edit a private deep copy, as denoise() rules must
		// leave their input tree as it stands for the caller still holding it and for the rules applied after

		const copy = cloneNode(tree, true);

		findAll(isBusted, [copy]).forEach(image => {
			image.attribs = { ...image.attribs, src: unversioned(image.attribs["src"] ?? "") };
		});

		return copy;


		function isBusted(element: Element): boolean {

			const src = element.attribs["src"] ?? "";

			return element.name === "img"
				&& CacheBusted.test(src)
				&& URL.parse(src)?.searchParams.has("v") === true;

		}

		function unversioned(src: string): string {

			const url = new URL(src);

			url.searchParams.delete("v");

			return url.href;

		}

	}

	function isEvent(value: unknown): value is EmbeddedEvent {
		return isObject(value, {
			"@type": type => type === "Event",
			name: isString,
			url: isString,
			description: isString,
			startDate: date => isOptional(date, isString),
			endDate: date => isOptional(date, isString),
			eventAttendanceMode: mode => isOptional(mode, isString),
			location: location => isOptional(location, isPlace),
			image: image => isOptional(image, image => isImage(image) || isArray(image, isImage)),
			[key]: isAny
		});
	}

	function isPlace(value: unknown): value is EmbeddedEvent["location"] {
		return isObject(value, {
			name: name => isOptional(name, isString),
			address: address => isOptional(address, address => isUnion(address, [isString, isAddress])),
			[key]: isAny
		});
	}

	function isAddress(value: unknown): value is Exclude<NonNullable<EmbeddedEvent["location"]>["address"], string> {
		return isObject(value, {
			streetAddress: street => isOptional(street, isString),
			addressLocality: locality => isOptional(locality, isString),
			addressCountry: country => isOptional(country, isString),
			[key]: isAny
		});
	}

	function isImage(value: unknown): value is string | { readonly url: string } {
		return isString(value) || isObject(value, {
			url: isString,
			[key]: isAny
		});
	}

	function render({
		name,
		url,
		description,
		startDate,
		endDate,
		eventAttendanceMode,
		location,
		image
	}: EmbeddedEvent): Markdown {

		return markdown`
			---
			title: ${JSON.stringify(name)}
			url: ${JSON.stringify(url)}
			---

			# ${name}

			${description}

			${facts({
			Start: startDate,
			End: endDate,
			Attendance: eventAttendanceMode,
			Location: opt(location, ({ name, address }) => [
				name,
				...isString(address) ? [address] : [
					address?.streetAddress,
					address?.addressLocality,
					address?.addressCountry
				]
			].filter(isString).join(", ")),
			Image: opt(some(image)[0], image => isString(image) ? image : image.url)
		})}
		`;

	}


	function facts(facts: Readonly<Record<string, Optional<string>>>): string {
		return Object.entries(facts)
			.filter(([, value]) => value !== undefined && value !== "")
			.map(([label, value]) => `- ${label}: ${value}`)
			.join("\n");
	}

}
