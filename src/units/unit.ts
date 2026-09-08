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

import { Organization } from "@/organizations/index.js";
import { Topic } from "@/taxonomies/index.js";
import { dcat } from "@/vocabularies/dcat.js";
import { dct } from "@/vocabularies/dublincore.js";
import { ec2u } from "@/vocabularies/ec2u.js";
import { OrganizationalUnit } from "@/vocabularies/org.js";
import { reference } from "@metreeca/blue/reference";
import { property, resource } from "@metreeca/blue/resource";
import { plain } from "@metreeca/blue/string";
import { multiple, repeatable, type State } from "@metreeca/blue/value";


export type Unit = State<typeof Unit>


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Unit() {
	return resource({

		class: ec2u.Unit,
		extends: [Organization, OrganizationalUnit],
		namespace: ec2u

	}, {

		subject: property({ forward: dct }, multiple(reference(Topic))),
		keyword: property({ forward: dcat }, multiple(plain))

	});
}
