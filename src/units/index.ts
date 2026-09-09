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
import { Organization } from "@/organizations/index.js";
import { Topic } from "@/taxonomies/index.js";
import { dcat } from "@/vocabularies/dcat.js";
import { dct } from "@/vocabularies/dct.js";
import { EC2U, base, ec2u } from "@/vocabularies/ec2u.js";
import { OrganizationalUnit } from "@/vocabularies/org.js";
import { reference } from "@metreeca/blue/reference";
import { property, resource } from "@metreeca/blue/resource";
import { text } from "@metreeca/blue/string";
import { multiple } from "@metreeca/blue/value";
import { immutable } from "@metreeca/core/structures";


export const units = immutable({

	id: `${base}/units`,

	isDefinedBy: `${base}/datasets/units`,
	dataset: datasets.id,

	label: "EC2U Units",

	title: "EC2U Research Units and Facilities",
	alternative: "EC2U Units",
	description: "Information about research units and supporting structures at EC2U partner universities.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40],

	issued: "2022-01-01"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Unit() {
	return resource({

		class: ec2u.Unit,
		extends: [Organization, OrganizationalUnit],
		namespace: ec2u

	}, {

		subject: property({ forward: dct }, multiple(reference(Topic))),
		keyword: property({ forward: dcat }, multiple(text))

	});
}
