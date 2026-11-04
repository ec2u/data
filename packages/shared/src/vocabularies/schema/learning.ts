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

import { Course } from "@ec2u/data-shared/courses/index.js";
import { FOAFPerson } from "@ec2u/data-shared/vocabularies/foaf.js";
import { SchemaEventAttendanceModeEnumeration } from "@ec2u/data-shared/vocabularies/schema/event.js";
import { SchemaThing, schema } from "@ec2u/data-shared/vocabularies/schema/index.js";
import { SchemaOrganization } from "@ec2u/data-shared/vocabularies/schema/organization.js";
import { SKOSConcept } from "@ec2u/data-shared/vocabularies/skos.js";
import { boolean } from "@metreeca/blue/boolean";
import { dictionary } from "@metreeca/blue/dictionary";
import { decimal } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { duration, string, tag, text } from "@metreeca/blue/string";
import { markdown } from "@metreeca/core/strings";


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

		class: schema.LearningResource,

		name: "Schema Learning Resource",

		description: "A creative work providing educational value."

	}, {

		numberOfCredits: optional(decimal({ minInclusive: 0 }), {
			description: "Number of academic credits awarded for the learning resource."
		}),

		teaches: optional(dictionary({ uniqueLang: true }), {
			description: "Goals, structure and contents of the learning resource."
		}),

		assesses: optional(dictionary({ uniqueLang: true }), {
			description: "Competences acquired through the learning resource."
		}),

		competencyRequired: optional(dictionary({ uniqueLang: true }), {
			description: "Competences to be demonstrated to complete the learning resource."
		}),

		educationalCredentialAwarded: optional(SchemaEducationalOccupationalCredential, {
			description: "Educational credential awarded on completion of the learning resource."
		}),

		occupationalCredentialAwarded: optional(SchemaEducationalOccupationalCredential, {
			description: "Occupational credential awarded on completion of the learning resource."
		}),

		provider: optional(reference(SchemaOrganization), {
			description: "Organization providing the learning resource."
		}),

		educationalLevel: multiple(reference(SKOSConcept), {
			description: "Educational levels of the learning resource."
		}),

		about: multiple(reference(SKOSConcept), {
			description: "Topics covered by the learning resource."
		})

	});
}

export function SchemaEducationalOccupationalProgram() {
	return resource(SchemaLearningResource, {

		class: schema.EducationalOccupationalProgram,

		name: "Schema Educational Program",

		description: "A program offered by an institution, setting the learning progress required to achieve an outcome."

	}, {

		timeToComplete: optional(duration, {
			description: "Expected time to complete the program."
		}),

		programPrerequisites: optional(dictionary({ uniqueLang: true }), {
			description: "Requirements a candidate must satisfy to be admitted to the program."
		}),

		hasCourse: multiple(reference(Course), {

			foreign: true,

			description: "Courses included in the program."

		})

	});
}

export function SchemaCourse() {
	return resource(SchemaLearningResource, {

		class: schema.Course,

		name: "Schema Course",

		description: "An educational course, which may be offered as distinct instances."

	}, {

		courseCode: optional(text, {
			description: "Code identifying the course within the offering of its provider."
		}),

		inLanguage: multiple(tag, {
			description: "Languages the course is taught in."
		}),

		timeRequired: optional(duration, {
			description: "Typical time required to work through the course."
		}),

		coursePrerequisites: optional(dictionary({ uniqueLang: true }), {
			description: "Requirements a candidate must satisfy to be admitted to the course."
		})

	});
}

export function SchemaCourseInstance() {
	return resource(SchemaThing, {

		class: schema.CourseInstance,

		name: "Schema Course Instance",

		description: "An offering of a course, distinct from other offerings by its time or location."

	}, {

		isAccessibleForFree: optional(boolean, {
			description: "Flags courses accessible free of charge."
		}),

		courseWorkload: optional(duration, {
			description: "Amount of work expected of students taking the course."
		}),

		courseMode: optional(SchemaEventAttendanceModeEnumeration, {
			description: "Mode of attendance offered by the course."
		}),

		instructor: multiple(reference(FOAFPerson), {
			description: "Persons teaching the course."
		}),

		about: multiple(reference(SKOSConcept)), // described by SchemaLearningResource, merged with it in Course

		audience: multiple(reference(SKOSConcept), {
			description: "Groups the course is intended for."
		})

	});
}

export function SchemaEducationalOccupationalCredential() {
	return resource(SchemaThing, {

		class: schema.EducationalOccupationalCredential,

		name: "Schema Educational Credential",

		description: "A credential awarded on completion of an educational or occupational course or program."

	}, {

		credentialCategory: required(SchemaCredentialCategory, {
			description: markdown`
				Kind of qualification the credential represents.

				| value         | description                                |
				|---------------|--------------------------------------------|
				| \`Degree\`      | an academic degree                         |
				| \`Certificate\` | a certificate of attendance or achievement |
				| \`Badge\`       | an Open Badge digital certification        |
			`
		})

	});
}
