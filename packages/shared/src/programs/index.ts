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
import { SchemaEducationalOccupationalProgram } from "@ec2u/data-shared/vocabularies/schema/learning.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, resource } from "@metreeca/blue/resource";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import type { Reference } from "@metreeca/qest/state";


export const programs = immutable({

	id: resolve(base, "/programs/"),

	isDefinedBy: resolve(base, "/datasets/programs"),
	dataset: datasets.id,

	label: "EC2U Programs",

	title: { en: "EC2U Degree and Occupational Programs" },
	alternative: { en: "EC2U Programs" },
	description: { en: "Formal degree and vocational qualification programs offered by EC2U partner universities." },

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id],

	issued: "2022-03-10"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Programs() {
	return resource(Dataset, {

		name: "Programs",
		description: "Formal degree and vocational qualification programs offered by EC2U partner universities."

	}, {

		resources: multiple(reference(Program))

	});
}

export function Program() {
	return resource(Offering, SchemaEducationalOccupationalProgram, {

		space: ec2u,
		class: ec2u.Program,

		name: "Program",
		description: "A formal degree or vocational qualification program offered by an EC2U partner university."

	});
}


/**
 * Identifies a program listed by a partner university.
 *
 * A program is named by the key the source lists it under together with the academic year it is delivered in, so that
 * the same key delivered in different years names distinct programs; a program with no stated year never shares its
 * identifier with one delivered in a stated year, even when both are listed under the same key.
 *
 * @param university The identifier of the university listing the program
 * @param key The key the source lists the program with
 * @param period The academic period the program is delivered in
 * @param period.year The academic year, formatted as `YYYY/YYYY`
 *
 * @returns The identifier of the program listed under `key` by `university` for the given academic year
 *
 * @throws {@link !RangeError RangeError} If `key` is blank or `year` is malformed
 */
export function getProgramId(university: Reference, key: string, period: {

	readonly year?: string

} = {}): Reference {

	return getOfferingId(programs.id, university, key, period);

}
