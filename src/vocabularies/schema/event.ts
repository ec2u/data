/*
 * Copyright © 2025-2026 Metreeca srl
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

import { Thing } from "@/vocabularies/schema/index.js";
import { Location } from "@/vocabularies/schema/location.js";
import { Organization } from "@/vocabularies/schema/organization.js";
import { Concept } from "@/vocabularies/skos.js";
import { boolean } from "@metreeca/blue/boolean";
import { reference } from "@metreeca/blue/reference";
import { resource } from "@metreeca/blue/resource";
import { instant, iri, string, tag } from "@metreeca/blue/string";
import { multiple, optional, repeatable, required } from "@metreeca/blue/value";


export function EventStatusType() {
	return string({
		in: [
			"EventCancelled",
			"EventMovedOnline",
			"EventPostponed",
			"EventRescheduled",
			"EventScheduled"
		]
	});
}

export function EventAttendanceModeEnumeration() {
	return string({
		in: [
			"OfflineEventAttendanceMode",
			"OnlineEventAttendanceMode",
			"MixedEventAttendanceMode"
		]
	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Event() {
	return resource({

		url: repeatable(iri),

		startDate: required(instant),
		endDate: optional(instant),

		inLanguage: optional(tag),
		isAccessibleForFree: optional(boolean),

		eventStatus: optional(EventStatusType),
		eventAttendanceMode: optional(EventAttendanceModeEnumeration),

		location: optional(Location),

		// ;( `image` not narrowed to an embedded `ImageObject`: an inherited reference cannot be swapped for an
		// ;( embedded resource, so the image credits stay out of reach

		publisher: optional(reference(Organization)),

		about: multiple(reference(Concept)),
		audience: multiple(reference(Concept))

	}, {

		extends: Thing

	});
}
