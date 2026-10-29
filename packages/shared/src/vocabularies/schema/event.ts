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

import { SchemaThing } from "@ec2u/data-shared/vocabularies/schema/index.js";
import { SchemaLocation } from "@ec2u/data-shared/vocabularies/schema/location.js";
import { SchemaOrganization } from "@ec2u/data-shared/vocabularies/schema/organization.js";
import { SKOSConcept } from "@ec2u/data-shared/vocabularies/skos.js";
import { boolean } from "@metreeca/blue/boolean";
import { reference } from "@metreeca/blue/reference";
import { multiple, nonempty, optional, required, resource } from "@metreeca/blue/resource";
import { instant, iri, string, tag } from "@metreeca/blue/string";


export function SchemaEventStatusType() {
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

export function SchemaEventAttendanceModeEnumeration() {
	return string({
		in: [
			"OfflineEventAttendanceMode",
			"OnlineEventAttendanceMode",
			"MixedEventAttendanceMode"
		]
	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function SchemaEvent() {
	return resource(SchemaThing, {

		url: nonempty(iri),

		startDate: required(instant),
		endDate: optional(instant),

		inLanguage: optional(tag),
		isAccessibleForFree: optional(boolean),

		eventStatus: optional(SchemaEventStatusType),
		eventAttendanceMode: optional(SchemaEventAttendanceModeEnumeration),

		location: optional(SchemaLocation),

		publisher: optional(reference(SchemaOrganization)),

		keywords: multiple(reference(SKOSConcept))

	});
}
