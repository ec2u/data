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
import { Dataset, Resource } from "@ec2u/data-shared/datasets/index.js";
import { Organization } from "@ec2u/data-shared/organizations/index.js";
import { FOAFPerson } from "@ec2u/data-shared/vocabularies/foaf.js";
import { org } from "@ec2u/data-shared/vocabularies/org.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, resource } from "@metreeca/blue/resource";
import { iri } from "@metreeca/blue/string";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import type { Reference } from "@metreeca/qest/state";
import * as uuid from "uuid";


export const persons = immutable({

	id: resolve(base, "/persons/"),

	isDefinedBy: resolve(base, "/datasets/persons"),
	dataset: datasets.id,

	label: "EC2U People",

	title: { en: "EC2U Faculty, Researchers and Staff" },
	alternative: { en: "EC2U People" },
	description: { en: "Staff involved in teaching and research activities at EC2U partner universities." },

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Persons() {
	return resource(Dataset, {

		name: "People",
		description: "Staff involved in teaching and research activities at EC2U partner universities."

	}, {

		resources: multiple(reference(Person))

	});
}

export function Person() {
	return resource(Resource, FOAFPerson, {

		space: ec2u,
		class: ec2u.Person,

		name: "Person",
		description: "A staff member involved in teaching and research activities at an EC2U partner university."

	}, {

		headOf: multiple(reference(Organization), {

			foreign: true,

			reverse: org.hasHead

		}),

		memberOf: multiple(reference(Organization), {

			forward: org,
			reverse: org.hasMember

		}),

		source: optional(iri, {

			hidden: true,

			forward: ec2u,

			name: "Source",
			description: "The source owning the person, which alone states and withdraws them."

		})

	});
}


/**
 * Identifies a person named by a partner university.
 *
 * The same name always names the same person within a university, so that every source of the university naming them
 * states the same person, while namesakes at different universities never do. A person owned by a single source is
 * named within that source alone, so that the source may withdraw them without affecting the people other sources
 * state under the same name, such as the authors of documents or the heads of units.
 *
 * @param university The identifier of the university naming the person
 * @param familyName The family name of the person
 * @param givenName The given name of the person
 * @param source The identifier of the source owning the person; omit for a person shared across sources
 *
 * @returns The identifier of the person named `givenName familyName` by `university`, within `source` if given
 */
export function getPersonId(university: Reference, familyName: string, givenName: string, source?: Reference): Reference {

	const scope = uuid.v3(university, uuid.v3.URL);

	return resolve(persons.id, uuid.v3(`${familyName}, ${givenName}`, source === undefined ? scope : uuid.v3(source, scope)));

}
