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
import { Topic } from "@/taxonomies/index.js";
import { EC2U, base, ec2u } from "@/vocabularies/ec2u.js";
import * as org from "@/vocabularies/org.js";
import { Organization as SchemaOrganization } from "@/vocabularies/schema/organization.js";
import { reference } from "@metreeca/blue/reference";
import { resource } from "@metreeca/blue/resource";
import { multiple } from "@metreeca/blue/value";
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
	return resource({

		// ;( `subOrganizationOf` and `hasSubOrganization` not narrowed: an override targeting the very shape that
		// ;( declares it closes a circular `extends` chain; `Unit` and `University` narrow them on their own

		// ;( `hasUnit` not narrowed to `Unit`: the inherited `org.OrganizationalUnit` target is reached through a
		// ;( thunk, and a thunk builds a fresh closure per call, so the lineage never matches by structure

		// !!! pin `classification` to the EC2U organizations taxonomy: it takes a narrowed `Topic` shape carrying an
		// !!! id `pattern`, and that taxonomy is not ported yet

		classification: multiple(reference(Topic)),

		hasHead: multiple(reference(Person)),
		hasMember: multiple(reference(Person))

	}, {

		namespace: ec2u,
		class: ec2u.Organization,

		extends: [Resource, org.Organization, SchemaOrganization]

	});
}
