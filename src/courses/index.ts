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

import { Offering } from "@/offerings/index.js";
import { Program } from "@/programs/index.js";
import { ec2u } from "@/vocabularies/ec2u.js";
import { schema } from "@/vocabularies/schema/index.js";
import { Course as SchemaCourse, CourseInstance } from "@/vocabularies/schema/learning.js";
import { reference } from "@metreeca/blue/reference";
import { property, resource } from "@metreeca/blue/resource";
import { string } from "@metreeca/blue/string";
import { multiple, optional } from "@metreeca/blue/value";


const YearPattern = "^\\d{4}/\\d{4}$";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Course() {
	return resource({

		class: ec2u.Course,
		extends: [Offering, SchemaCourse, CourseInstance],
		namespace: ec2u

	}, {

		year: optional(string({ pattern: YearPattern })),
		term: multiple(Term),

		inProgram: property({ reverse: schema.hasCourse }, multiple(reference(Program))),

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
