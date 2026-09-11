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

import { Course as EC2UCourse } from "@/courses/index.js";
import { Person } from "@/vocabularies/foaf.js";
import { EventAttendanceModeEnumeration } from "@/vocabularies/schema/event.js";
import { Thing } from "@/vocabularies/schema/index.js";
import { Organization } from "@/vocabularies/schema/organization.js";
import { Concept } from "@/vocabularies/skos.js";
import { boolean } from "@metreeca/blue/boolean";
import { decimal } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { resource, type ResourceShape } from "@metreeca/blue/resource";
import { duration, string, tag, text } from "@metreeca/blue/string";
import { multiple, optional, required } from "@metreeca/blue/value";


export function CredentialCategory() {
	return string({
		in: [
			"Degree",
			"Certificate",
			"Badge"
		]
	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function LearningResource() {
	return resource({

		numberOfCredits: optional(decimal({ minInclusive: 0 })),

		teaches: optional(text),
		assesses: optional(text),
		competencyRequired: optional(text),

		educationalCredentialAwarded: optional(EducationalOccupationalCredential),
		occupationalCredentialAwarded: optional(EducationalOccupationalCredential),

		provider: optional(reference(Organization)),

		educationalLevel: multiple(reference(Concept)),
		about: multiple(reference(Concept))

	}, {

		extends: Thing

	});
}

export function EducationalOccupationalProgram() {
	return resource({

		timeToComplete: optional(duration),

		programPrerequisites: optional(text),

		hasCourse: multiple(reference((): ResourceShape => EC2UCourse(), { foreign: true }))

	}, {

		extends: LearningResource

	});
}

export function Course() {
	return resource({

		courseCode: optional(text),

		inLanguage: multiple(tag),
		timeRequired: optional(duration),

		coursePrerequisites: optional(text)

	}, {

		extends: LearningResource

	});
}

export function CourseInstance() {
	return resource({

		isAccessibleForFree: optional(boolean),
		courseWorkload: optional(duration),
		courseMode: optional(EventAttendanceModeEnumeration),

		instructor: multiple(reference(Person)),

		about: multiple(reference(Concept)),
		audience: multiple(reference(Concept))

	}, {

		extends: Thing

	});
}

export function EducationalOccupationalCredential() {
	return resource({

		credentialCategory: required(CredentialCategory)

	}, {

		extends: Thing

	});
}
