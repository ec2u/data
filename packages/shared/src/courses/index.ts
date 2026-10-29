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

import { base, EC2U, ec2u } from "@ec2u/data-shared";
import { datasets, licenses } from "@ec2u/data-shared/datasets/index.core.js";
import { Dataset } from "@ec2u/data-shared/datasets/index.js";
import { getOfferingId, Offering } from "@ec2u/data-shared/offerings/index.js";
import { Person } from "@ec2u/data-shared/persons/index.js";
import { Program } from "@ec2u/data-shared/programs/index.js";
import { StakeholderTopic } from "@ec2u/data-shared/taxonomies/stakeholders.js";
import { schema } from "@ec2u/data-shared/vocabularies/schema/index.js";
import { SchemaCourse, SchemaCourseInstance } from "@ec2u/data-shared/vocabularies/schema/learning.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, resource } from "@metreeca/blue/resource";
import { string } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import type { Reference } from "@metreeca/qest/state";


export const courses = immutable({

	id: resolve(base, "/courses/"),

	isDefinedBy: resolve(base, "/datasets/courses"),
	dataset: datasets.id,

	label: "EC2U Courses",

	title: { en: "EC2U Academic and Occupational Courses" },
	alternative: { en: "EC2U Courses" },
	description: { en: "Degree, vocational and personal development courses offered by EC2U partner universities." },

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id],

	issued: "2022-03-10"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Courses = State<typeof Courses>;
export type Course = State<typeof Course>;


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


/**
 * Identifies a course listed by a partner university.
 *
 * A course is named by the key the source lists it under together with the academic year and terms it is delivered
 * in, so that the same key delivered in different years or terms names distinct courses; a missing year or term never
 * matches a stated one. Terms are matched as a set, so their order and repetitions are immaterial.
 *
 * @param university The identifier of the university listing the course
 * @param key The key the source lists the course with
 * @param period The academic period the course is delivered in
 * @param period.year The academic year, formatted as `YYYY/YYYY`
 * @param period.term The academic terms
 *
 * @returns The identifier of the course listed under `key` by `university` for the given academic period
 *
 * @throws {@link !RangeError RangeError} If `key` is blank or `year` is malformed
 */
export function getCourseId(university: Reference, key: string, period: {

	readonly year?: string
	readonly term?: readonly State<typeof Term>[]

} = {}): Reference {

	return getOfferingId(courses.id, university, key, period);

}
