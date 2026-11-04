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

import { base, Dataset, EC2U, ec2u, licenses, Place } from "@ec2u/data-shared";
import { Organization } from "@ec2u/data-shared/organizations/index.js";
import { OrgFormalOrganization } from "@ec2u/data-shared/vocabularies/org.js";
import { skos } from "@ec2u/data-shared/vocabularies/skos.js";
import { int } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { multiple, nonempty, required, resource } from "@metreeca/blue/resource";
import { iri, text, year } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";


export const universities = immutable({

	id: resolve(base, "/universities/"),

	dataset: base,

	label: "EC2U Universities",

	title: { en: "EC2U Partner Universities" },
	alternative: { en: "EC2U Universities" },
	description: { en: "Background, historical context and statistical data about EC2U partner universities." },

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id],

	created: "2021-02-20",
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

		altLabel: required(text, {

			forward: skos,

			description: "The short name the university is known by across the alliance, as its city."

		}),

		depiction: nonempty(iri),
		homepage: nonempty(iri),

		inception: required(year, {
			description: "Year the university was founded."
		}),

		students: required(int, {
			description: "Number of students enrolled at the university."
		}),

		city: required(reference(Place), {
			description: "City where the university is located."
		}),

		country: required(reference(Place), {
			description: "Country where the university is located."
		})

	});
}
