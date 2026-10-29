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

import { Resource } from "@ec2u/data-shared/datasets/index.js";
import { Organization } from "@ec2u/data-shared/organizations/index.js";
import { ISCED2011Topic } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { Topic } from "@ec2u/data-shared/taxonomies/index.js";
import { ec2u } from "@ec2u/data-shared";
import { SchemaLearningResource } from "@ec2u/data-shared/vocabularies/schema/learning.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, resource } from "@metreeca/blue/resource";
import { iri, string } from "@metreeca/blue/string";
import { resolve } from "@metreeca/core/resource";
import type { Reference } from "@metreeca/qest/state";
import * as uuid from "uuid";


const YearPattern = "^\\d{4}/\\d{4}$";


export function Offering() {
	return resource(Resource, SchemaLearningResource, {

		space: ec2u,
		class: ec2u.Offering,

		name: "Offering",
		description: "An educational offering of an EC2U partner university."

	}, {

		year: optional(string({ pattern: YearPattern }), {

			name: "Academic Year",
			description: "The academic year in which the offering is delivered."

		}),

		provider: optional(reference(Organization)),

		educationalLevel: multiple(reference(ISCED2011Topic)),
		about: multiple(reference(Topic)), // ISCED-F 2013 fields and SDGs ;( a union of references types models as {}

		source: optional(iri, {

			hidden: true,

			forward: ec2u,

			name: "Source",
			description: "The source listing the offering, which alone states and withdraws it."

		}),

		digest: optional(string, {

			hidden: true,

			forward: ec2u,

			name: "Source Digest",
			description: "A unique identification of the content the source entry carried when it was read."

		})

	});
}


/**
 * Identifies an offering listed by a partner university.
 *
 * An offering is named by the key the source lists it under together with the academic year and terms it is delivered
 * in, so that the same key delivered in different years or terms names distinct offerings, while a listing re-read on
 * a later run restates the offerings it already stood for. A missing year or term is a value of its own: an offering
 * with no stated year never shares its identifier with one delivered in a stated year. Terms are matched as a set, so
 * their order and repetitions are immaterial, and an empty list of terms is the same as no terms at all.
 *
 * @param dataset The identifier of the dataset the offering belongs to
 * @param university The identifier of the university listing the offering
 * @param key The key the source lists the offering with
 * @param period The academic period the offering is delivered in
 * @param period.year The academic year, formatted as `YYYY/YYYY`
 * @param period.term The academic terms
 *
 * @returns The identifier of the offering listed under `key` by `university` for `period`, within `dataset`
 *
 * @throws {@link !RangeError RangeError} If `key` is blank or `year` is malformed
 */
export function getOfferingId(dataset: Reference, university: Reference, key: string, {

	year,
	term = []

}: {

	readonly year?: string
	readonly term?: readonly string[]

} = {}): Reference {

	if ( key.trim() === "" ) {

		throw new RangeError("blank offering key");

	} else if ( year !== undefined && !new RegExp(YearPattern).test(year) ) {

		throw new RangeError(`malformed academic year <${year}>`);

	} else {

		// a JSON tuple keeps the fields apart whatever they hold, and null states a missing year in a slot of its own

		const name = JSON.stringify([key, year ?? null, [...new Set(term)].sort()]); // ;( no es2023 toSorted(): sorts a copy

		return resolve(dataset, uuid.v3(name, uuid.v3(university, uuid.v3.URL)));

	}

}
