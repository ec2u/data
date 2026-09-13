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

import { CCBYNCND40, Copyright, datasets } from "@/datasets/index.core.js";
import { Resource } from "@/datasets/index.js";
import { Organization } from "@/organizations/index.js";
import { EventTopic } from "@/taxonomies/pipes/events.core.js";
import { StakeholderTopic } from "@/taxonomies/pipes/stakeholders.core.js";
import { University } from "@/universities/index.js";
import { base, CommentLength, EC2U, ec2u, LabelLength } from "@/vocabularies/ec2u.js";
import { SchemaEvent } from "@/vocabularies/schema/event.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { text } from "@metreeca/blue/string";
import type { Instance } from "@metreeca/blue/value";
import type { IRI } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/structures";
import * as uuid from "uuid";


export const events = immutable({

	id: `${base}/events`,

	isDefinedBy: `${base}/datasets/events`,
	dataset: datasets.id,

	label: "EC2U Events",

	title: "EC2U Academic and Local Events",
	alternative: "EC2U Events",
	description: "Information about events at EC2U partner universities and associated local organizations.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40],

	issued: "2022-01-01"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Event = Instance<typeof Event> // !!! remove


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Publisher() {
	return resource(Organization, {

		university: required(reference(University))

	});
}

export function Event() {
	return resource(Resource, SchemaEvent, {

		name: optional(text({ maxLength: LabelLength })),
		disambiguatingDescription: optional(text({ maxLength: CommentLength })),

		publisher: optional(reference(Organization)),

		about: multiple(reference(EventTopic)),
		audience: multiple(reference(StakeholderTopic))

	}, {

		space: ec2u,
		class: ec2u.Event

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function isStaleEvent(event: Event): boolean {

	return false; // !!! tbi

}

export function createEventId(url: string | URL): IRI {

	return `${(events.id)}/${uuid.v3(String(url), uuid.v3.URL)}`;

}
