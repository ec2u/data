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
import { Person } from "@ec2u/data-shared/persons/index.js";
import { OrganizationTopic } from "@ec2u/data-shared/taxonomies/organizations.js";
import { Unit } from "@ec2u/data-shared/units/index.js";
import { OrgOrganization } from "@ec2u/data-shared/vocabularies/org.js";
import { SchemaOrganization } from "@ec2u/data-shared/vocabularies/schema/organization.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, resource } from "@metreeca/blue/resource";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import type { Reference } from "@metreeca/qest/state";
import * as uuid from "uuid";


export const organizations = immutable({

	id: resolve(base, "/organizations/"),

	isDefinedBy: resolve(base, "/datasets/organizations"),
	dataset: datasets.id,

	label: "EC2U Organisations",

	title: { en: "EC2U Related Organisations" },
	alternative: { en: "EC2U Organisations" },
	description: { en: "Organisations related to EC2U partner universities." },

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id]

});

export const alliance = immutable({

	id: EC2U,

	dataset: organizations.id,

	label: "European Campus of City-Universities",
	prefLabel: { en: "European Campus of City-Universities" },
	altLabel: "EC2U"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Organizations() {
	return resource(Dataset, {

		name: "Organisations",
		description: "Organisations related to EC2U partner universities."

	}, {

		resources: multiple(reference(Organization))

	});
}

export function Organization() {
	return resource(Resource, OrgOrganization, SchemaOrganization, {

		space: ec2u,
		class: ec2u.Organization,

		name: "Organisation",
		description: "An organisation related to EC2U partner universities."

	}, {

		subOrganizationOf: multiple(reference(Organization)),
		hasSubOrganization: multiple(reference(Organization)),

		hasUnit: multiple(reference(Unit)),

		classification: multiple(reference(OrganizationTopic)),

		hasHead: multiple(reference(Person)),
		hasMember: multiple(reference(Person))

	});
}


/**
 * Identifies an organisation named by a partner university.
 *
 * The same key always names the same organisation within a university, so that every source of the university naming
 * it states the same organisation, while equal keys at different universities never do. Keys are matched regardless
 * of case.
 *
 * @param university The identifier of the university naming the organisation
 * @param key The key the organisation is named with, either its home page or its name
 *
 * @returns The identifier of the organisation named by `key` at `university`
 */
export function getOrganizationId(university: Reference, key: string): Reference {

	return resolve(organizations.id, uuid.v3(key.toLowerCase(), uuid.v3(university, uuid.v3.URL)));

}
