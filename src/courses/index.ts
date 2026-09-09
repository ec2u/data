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

import { CCBYNCND40, Copyright, datasets } from "@/datasets/index.core.js";
import { Offering } from "@/offerings/index.js";
import { Person } from "@/persons/index.js";
import { Program } from "@/programs/index.js";
import { Topic } from "@/taxonomies/index.js";
import { EC2U, base, ec2u } from "@/vocabularies/ec2u.js";
import { schema } from "@/vocabularies/schema/index.js";
import { Course as SchemaCourse, CourseInstance } from "@/vocabularies/schema/learning.js";
import { reference } from "@metreeca/blue/reference";
import { property, resource } from "@metreeca/blue/resource";
import { string } from "@metreeca/blue/string";
import { multiple, optional } from "@metreeca/blue/value";
import { immutable } from "@metreeca/core/structures";


const YearPattern = "^\\d{4}/\\d{4}$";


export const courses = immutable({

	id: `${base}/courses`,

	isDefinedBy: `${base}/datasets/courses`,
	dataset: datasets.id,

	label: "EC2U Courses",

	title: "EC2U Academic and Occupational Courses",
	alternative: "EC2U Courses",
	description: "Degree, vocational and personal development courses offered by EC2U partner universities.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40],

	issued: "2022-03-10"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Course() {
	return resource({

		class: ec2u.Course,
		extends: [Offering, SchemaCourse, CourseInstance],
		namespace: ec2u

	}, {

		year: optional(string({ pattern: YearPattern })),
		term: multiple(Term),

		audience: multiple(reference(Topic)),
		instructor: multiple(reference(Person)),

		inProgram: property({ reverse: schema.hasCourse }, multiple(reference(Program)))

	});
}

export function Term() {
	return string({
		in: [
			"Annual",
			"First",
			"Second",
			"Summer",
			"Open"
		]
	});
}
