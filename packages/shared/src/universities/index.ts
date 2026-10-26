/*
 * Copyright © 2020-2026 EC2U Alliance
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
import { Organization } from "@ec2u/data-shared/organizations/index.js";
import { base, EC2U, ec2u, Place } from "@ec2u/data-shared";
import { OrgFormalOrganization } from "@ec2u/data-shared/vocabularies/org.js";
import { int } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { multiple, nonempty, required, resource } from "@metreeca/blue/resource";
import { iri, year } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";


export const universities = immutable({

	id: resolve(base, "/universities/"),

	isDefinedBy: resolve(base, "/datasets/universities"),
	dataset: datasets.id,

	label: "EC2U Universities",

	title: { en: "EC2U Partner Universities" },
	alternative: { en: "EC2U Universities" },
	description: { en: "Background, historical context and statistical data about EC2U partner universities." },

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40],

	issued: "2022-01-01"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type University = State<typeof University>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Universities() {
	return resource(Dataset, {

		name: "Universities",
		description: "Background, historical context and statistical data about EC2U partner universities."

	}, {

		resources: multiple(reference(University))

	});
}

export function University() {
	return resource(Organization, Place, OrgFormalOrganization, {

		space: ec2u,
		class: ec2u.University,

		name: "University",
		description: "An EC2U partner university."

	}, {

		dataset: required(reference(resource(Dataset, { hasValue: [ universities.id ] }))),

		depiction: nonempty(iri),
		homepage: nonempty(iri),

		inception: required(year),
		students: required(int),

		city: required(reference(Place)),
		country: required(reference(Place))

	});
}
