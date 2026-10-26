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

import { base, CommentLength, EC2U, ec2u, LabelLength } from "@ec2u/data-shared";
import { CCBYNCND40, Copyright, datasets } from "@ec2u/data-shared/datasets/index.core.js";
import { Dataset, Resource } from "@ec2u/data-shared/datasets/index.js";
import { Organization } from "@ec2u/data-shared/organizations/index.js";
import { EventTopic } from "@ec2u/data-shared/taxonomies/events.js";
import { University } from "@ec2u/data-shared/universities/index.js";
import { SchemaEvent } from "@ec2u/data-shared/vocabularies/schema/event.js";
import { dictionary } from "@metreeca/blue/dictionary";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import type { State } from "@metreeca/blue/value";
import type { URLLike } from "@metreeca/core";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import type { Reference } from "@metreeca/qest/state";
import * as uuid from "uuid";


export const events = immutable({

	id: resolve(base, "/events/"),

	isDefinedBy: resolve(base, "/datasets/events"),
	dataset: datasets.id,

	label: "EC2U Events",

	title: { en: "EC2U Academic and Local Events" },
	alternative: { en: "EC2U Events" },
	description: { en: "Information about events at EC2U partner universities and associated local organizations." },

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40],

	issued: "2022-01-01"

});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Event = State<typeof Event>;
export type Publisher = State<typeof Publisher>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Events() {
	return resource(Dataset, {

		name: "Events",
		description: "Information about events at EC2U partner universities and associated local organisations."

	}, {

		resources: multiple(reference(Event))

	});
}

export function Event() {
	return resource(Resource, SchemaEvent, {

		space: ec2u,
		class: ec2u.Event,

		name: "Event",
		description: "An event at an EC2U partner university or an associated local organisation."

	}, {

		name: optional(dictionary({ uniqueLang: true, maxLength: LabelLength })),
		disambiguatingDescription: optional(dictionary({ uniqueLang: true, maxLength: CommentLength })),

		publisher: optional(reference(Organization)),

		keywords: multiple(reference(EventTopic))

	});
}

export function Publisher() {
	return resource(Organization, {

		name: "Publisher",
		description: "An organisation's event calendar for an EC2U partner university."

	}, {

		university: required(reference(University))

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks whether an event has run its course.
 *
 * An event is read as stale from the midnight opening the current UTC day, so that one still running today is left in
 * place whatever the hour. An event stating no end is weighed by its start, as a single-day event.
 *
 * @param event The dates of the event to be checked
 * @param event.startDate The timestamp the event starts at
 * @param event.endDate The timestamp the event ends at; omit for an event stating none
 *
 * @returns `true` if `event` ended before the current UTC day; `false` otherwise
 */
export function isStaleEvent(event: {

	readonly startDate: string
	readonly endDate?: string

}): boolean {

	const now = new Date();
	const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

	return Date.parse(event.endDate ?? event.startDate) < midnight;

}

/**
 * Identifies the event a source page states.
 *
 * The same address always names the same event, so that a page re-read on a later run restates the event it already
 * stood for rather than minting a second one.
 *
 * @param url The address of the source page the event is derived from
 *
 * @returns The identifier of the event stated by the page at `url`
 */
export function getEventId(url: URLLike): Reference {

	return `${(events.id)}/${uuid.v3(String(url), uuid.v3.URL)}`;

}
