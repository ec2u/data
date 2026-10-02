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

import { CCBYNCND40, Copyright, datasets } from "@ec2u/data-shared/datasets/index.core.js";
import { Dataset, Resource } from "@ec2u/data-shared/datasets/index.js";
import { Organization } from "@ec2u/data-shared/organizations/index.js";
import { EC2U, base, ec2u } from "@ec2u/data-shared";
import { FOAFPerson } from "@ec2u/data-shared/vocabularies/foaf.js";
import { org } from "@ec2u/data-shared/vocabularies/org.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, resource } from "@metreeca/blue/resource";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";


export const persons = immutable({

	id: resolve(base, "/persons/"),

	isDefinedBy: resolve(base, "/datasets/persons"),
	dataset: datasets.id,

	label: "EC2U People",

	title: "EC2U Faculty, Researchers and Staff",
	alternative: "EC2U People",
	description: "Staff involved in teaching and research activities at EC2U partner universities.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40]

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

			forward: org

		}),

		memberOf: multiple(reference(Organization), {

			forward: org,
			reverse: org.hasMember

		})

	});
}
