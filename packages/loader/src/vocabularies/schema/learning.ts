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

import { Course } from "@ec2u/data-loader/courses/index.js";
import { FOAFPerson } from "@ec2u/data-loader/vocabularies/foaf.js";
import { SchemaEventAttendanceModeEnumeration } from "@ec2u/data-loader/vocabularies/schema/event.js";
import { SchemaThing, schema } from "@ec2u/data-loader/vocabularies/schema/index.js";
import { SchemaOrganization } from "@ec2u/data-loader/vocabularies/schema/organization.js";
import { SKOSConcept } from "@ec2u/data-loader/vocabularies/skos.js";
import { boolean } from "@metreeca/blue/boolean";
import { decimal } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { duration, string, tag, text } from "@metreeca/blue/string";


export function SchemaCredentialCategory() {
	return string({
		in: [
			"Degree",
			"Certificate",
			"Badge"
		]
	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function SchemaLearningResource() {
	return resource(SchemaThing, {

		numberOfCredits: optional(decimal({ minInclusive: 0 })),

		teaches: optional(text),
		assesses: optional(text),
		competencyRequired: optional(text),

		educationalCredentialAwarded: optional(SchemaEducationalOccupationalCredential),
		occupationalCredentialAwarded: optional(SchemaEducationalOccupationalCredential),

		provider: optional(reference(SchemaOrganization)),

		educationalLevel: multiple(reference(SKOSConcept)),
		about: multiple(reference(SKOSConcept))

	});
}

export function SchemaEducationalOccupationalProgram() {
	return resource(SchemaLearningResource, {

		timeToComplete: optional(duration),

		programPrerequisites: optional(text),

		hasCourse: multiple(reference(Course), {

			foreign: true

		})

	});
}

export function SchemaCourse() {
	return resource(SchemaLearningResource, {

		courseCode: optional(text),

		inLanguage: multiple(tag),
		timeRequired: optional(duration),

		coursePrerequisites: optional(text)

	});
}

export function SchemaCourseInstance() {
	return resource(SchemaThing, {

		isAccessibleForFree: optional(boolean),
		courseWorkload: optional(duration),
		courseMode: optional(SchemaEventAttendanceModeEnumeration),

		instructor: multiple(reference(FOAFPerson)),

		about: multiple(reference(SKOSConcept)),
		audience: multiple(reference(SKOSConcept))

	});
}

export function SchemaEducationalOccupationalCredential() {
	return resource(SchemaThing, {

		class: schema.EducationalOccupationalCredential

	}, {

		credentialCategory: required(SchemaCredentialCategory)

	});
}
