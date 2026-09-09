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
import { Organization } from "@/organizations/index.js";
import { EC2U, base, ec2u } from "@/vocabularies/ec2u.js";
import * as foaf from "@/vocabularies/foaf.js";
import { org } from "@/vocabularies/org.js";
import { reference } from "@metreeca/blue/reference";
import { property, resource } from "@metreeca/blue/resource";
import { multiple } from "@metreeca/blue/value";
import { immutable } from "@metreeca/core/structures";


export const persons = immutable({

	id: `${base}/persons`,

	isDefinedBy: `${base}/datasets/persons`,
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

export function Person() {
	return resource({

		class: ec2u.Person,
		extends: [Resource, foaf.Person],
		namespace: ec2u

	}, {

		headOf: property({ forward: org }, multiple(reference(Organization))),

		memberOf: property({

			forward: org,
			reverse: org.hasMember

		}, multiple(reference(Organization)))

	});
}
