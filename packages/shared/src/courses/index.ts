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

import { CCBYNCND40, Copyright, datasets } from "@ec2u/data-shared/datasets/index.core.js";
import { Dataset } from "@ec2u/data-shared/datasets/index.js";
import { Offering } from "@ec2u/data-shared/offerings/index.js";
import { Person } from "@ec2u/data-shared/persons/index.js";
import { Program } from "@ec2u/data-shared/programs/index.js";
import { StakeholderTopic } from "@ec2u/data-shared/taxonomies/stakeholders.js";
import { EC2U, base, ec2u } from "@ec2u/data-shared";
import { schema } from "@ec2u/data-shared/vocabularies/schema/index.js";
import { SchemaCourse, SchemaCourseInstance } from "@ec2u/data-shared/vocabularies/schema/learning.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, resource } from "@metreeca/blue/resource";
import { string } from "@metreeca/blue/string";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";


const YearPattern = "^\\d{4}/\\d{4}$";


export const courses = immutable({

	id: resolve(base, "/courses/"),

	isDefinedBy: resolve(base, "/datasets/courses"),
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

export function Courses() {
	return resource(Dataset, {

		name: "Courses",
		description: "Degree, vocational and personal development courses offered by EC2U partner universities."

	}, {

		resources: multiple(reference(Course))

	});
}

export function Course() {
	return resource(Offering, SchemaCourse, SchemaCourseInstance, {

		space: ec2u,
		class: ec2u.Course,

		name: "Course",
		description: "A degree, vocational or personal development course offered by an EC2U partner university."

	}, {

		year: optional(string({ pattern: YearPattern })),
		term: multiple(Term),

		audience: multiple(reference(StakeholderTopic)),
		instructor: multiple(reference(Person)),

		inProgram: multiple(reference(Program), {

			reverse: schema.hasCourse

		})

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
