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

import { Person } from "@/vocabularies/foaf.js";
import { EventAttendanceModeEnumeration } from "@/vocabularies/schema/event.js";
import { Thing } from "@/vocabularies/schema/index.js";
import { Organization } from "@/vocabularies/schema/organization.js";
import { Concept } from "@/vocabularies/skos.js";
import { boolean } from "@metreeca/blue/boolean";
import { decimal } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { resource } from "@metreeca/blue/resource";
import { duration, plain, string, tag } from "@metreeca/blue/string";
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

		extends: Thing

	}, {

		numberOfCredits: optional(decimal({ minInclusive: 0 })),

		teaches: optional(plain),
		assesses: optional(plain),
		competencyRequired: optional(plain),

		educationalCredentialAwarded: optional(EducationalOccupationalCredential),
		occupationalCredentialAwarded: optional(EducationalOccupationalCredential),

		provider: optional(reference(Organization)),

		educationalLevel: multiple(reference(Concept)),
		about: multiple(reference(Concept))

	});
}

export function EducationalOccupationalProgram() {
	return resource({

		extends: LearningResource

	}, {

		timeToComplete: optional(duration),

		programPrerequisites: optional(plain),

		hasCourse: multiple(reference(Course, { foreign: true }))

	});
}

export function Course() {
	return resource({

		extends: LearningResource

	}, {

		courseCode: optional(plain),

		inLanguage: multiple(tag),
		timeRequired: optional(duration),

		coursePrerequisites: optional(plain)

	});
}

export function CourseInstance() {
	return resource({

		extends: Thing

	}, {

		isAccessibleForFree: optional(boolean),
		courseWorkload: optional(duration),
		courseMode: optional(EventAttendanceModeEnumeration),

		instructor: multiple(reference(Person)),

		about: multiple(reference(Concept)),
		audience: multiple(reference(Concept))

	});
}

export function EducationalOccupationalCredential() {
	return resource({

		extends: Thing

	}, {

		credentialCategory: required(CredentialCategory)

	});
}
