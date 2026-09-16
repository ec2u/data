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
import { Resource } from "@/datasets/index.js";
import { Person } from "@/persons/index.js";
import { OrganizationTopic } from "@/taxonomies/pipes/organizations.core.js";
import { Unit } from "@/units/index.js";
import { EC2U, base, ec2u } from "@/vocabularies/ec2u.js";
import { OrgOrganization } from "@/vocabularies/org.js";
import { SchemaOrganization } from "@/vocabularies/schema/organization.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, resource } from "@metreeca/blue/resource";
import { immutable } from "@metreeca/core/structures";


export const organizations = immutable({

	id: `${base}/organizations`,

	isDefinedBy: `${base}/datasets/organizations`,
	dataset: datasets.id,

	label: "EC2U Organizations",

	title: "EC2U Related Organizations",
	alternative: "EC2U Organizations",
	description: "Organisations related to EC2U partner universities.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Organization() {
	return resource(Resource, OrgOrganization, SchemaOrganization, {

		space: ec2u,
		class: ec2u.Organization

	}, {

		subOrganizationOf: multiple(reference(Organization)),
		hasSubOrganization: multiple(reference(Organization)),

		hasUnit: multiple(reference(Unit)),

		classification: multiple(reference(OrganizationTopic)),

		hasHead: multiple(reference(Person)),
		hasMember: multiple(reference(Person))

	});
}
