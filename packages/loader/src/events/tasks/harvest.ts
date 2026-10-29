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
} from "@metreeca/core";
import { type Some, some } from "@metreeca/core/arrays";
import { type Markdown, markdown } from "@metreeca/core/strings";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { coalesce, map, trim } from "@metreeca/flow/tasks";
import { focus, html, untag, unwrap } from "@metreeca/mime-xml";
import { fetch } from "@metreeca/pipe-url";
import { denoise } from "@metreeca/work/mime-xml/denoise.js";


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
 * same document on every run, and addresses a site obfuscates reach the extractor in plain form.
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
		(denoise())
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
			Image: opt(some(image)[0],image => isString(image) ? image : image.url)
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
